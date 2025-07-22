{ pkgs ? import <nixpkgs> {} }:

let
  prismaUtilsSrc = pkgs.fetchFromGitHub {
    owner  = "VanCoding";
    repo   = "nix-prisma-utils";
    rev    = "0d4f9a4e3efcfa3161f2614c4964b5b34fac4298";
    sha256 = "sha256-A/hOhcE/16QlknM7XswWmj3I+XQob6Cclfm4AgoLIPE=";
  };

  prismaFactory = import "${prismaUtilsSrc}/prisma.nix";
  
  prisma = (prismaFactory {
    inherit pkgs;
    prisma-fmt-hash = "sha256-JGIWOIjGgjvJr/LLQx9VWrEw487ypg11cP5oFIPRVvI=";
    query-engine-hash = "sha256-ArKIBmyY8lKNV00xoHFtrsu4pmqBSqf6oTIp98lM3Ks=";
    libquery-engine-hash = "sha256-43RovuDe7k3D1sbsXiOwOXAPzjgxKoGzVkkkbjUdptY=";
    schema-engine-hash = "sha256-4YZQCUJ5yxYGOdSPcAZHskD1kGReZPMo+kioPIniNtI=";
  }).fromNpmLock ./package-lock.json;

  services = {
    postgresql = {
      enable = true;
      ensureDatabases = [ "dogeprize" ];
      ensureUsers = [
        {
          name = "dogeprize";
          ensureDBOwnership = true;
        }
      ];
      authentication = pkgs.lib.mkOverride 10 ''
        local all all trust
        host all all 127.0.0.1/32 trust
        host all all ::1/128 trust
      '';
    };
  };

  doge-prize-server = pkgs.buildNpmPackage {
    pname = "doge-prize-server";
    version = "1.0.0";

    src = ./.;

    npmDepsHash = "sha256-ru6/ZWG1k3How4pGWsm5KXzDSxZnQfpPMWYb43pOLjI=";

    env = prisma.env;

    buildPhase = ''
      ${prisma.shellHook}
      npm install
      npx prisma generate
      npm run build
    '';

    installPhase = ''
      mkdir -p $out
      cp -r . $out/
    '';

    meta = with pkgs.lib; {
      description = "Doge Prize Server";
      homepage = "https://github.com/dogecoinfoundation/doge-prize";
      license = licenses.mit;
      platforms = platforms.unix;
    };
  };

  # Create a script to run the Next.js server application
  run-script = pkgs.writeScriptBin "run.sh" ''
#!${pkgs.stdenv.shell}

export PATH=${pkgs.nodejs_22}/bin:${pkgs.nodePackages.npm}/bin:${pkgs.bash}/bin:$PATH

if [ ! -d "/storage/.doge-prize-server" ]; then
  mkdir /storage/.doge-prize-server
fi

  cat <<EOF > /storage/.doge-prize-server/dogebox.toml

[dogecoind.mainnet]
  rpchost = "$DBX_IFACE_CORE_RPC_HOST"
  rpcport = $DBX_IFACE_CORE_RPC_PORT
  rpcpass = "dogebox_core_pup_temporary_static_password"
  rpcuser = "dogebox_core_pup_temporary_static_username"
EOF

cd ${doge-prize-server}

export NODE_ENV=production
export CONFIG_ENV=production
export PORT=3644
export HOSTNAME=0.0.0.0

export DATABASE_URL=postgresql://dogeprize:dogeprize@localhost:5432/dogeprize

if [ ! -f /storage/nextauth-secret ]; then
  ${pkgs.openssl}/bin/openssl rand -base64 32 > /storage/nextauth-secret
fi

export NEXTAUTH_SECRET=$(cat /storage/nextauth-secret)

# Wait a sec for postgres to ready up.
sleep 5

${prisma.shellHook}
${pkgs.nodejs_22}/bin/node ${doge-prize-server}/node_modules/.bin/prisma migrate deploy &&
npm run init-db &&
${pkgs.nodejs_22}/bin/node ${doge-prize-server}/node_modules/.bin/next start -p $PORT -H $HOSTNAME
  '';

in {
  inherit services;
  "doge-prize-server" = run-script;
}
