{ pkgs ? import <nixpkgs> {} }:

let
  doge-prize-client = pkgs.buildNpmPackage {
    pname = "doge-prize-client";
    version = "1.0.0";
    src = ./.; 

    npmDepsHash = "sha256-2ate4Io78MFwnuOtygnA1AUFQWxVI4rYBoYX2ryhsAE=";

    buildPhase = ''
      npm install
      npm run build
    '';

    installPhase = ''
      mkdir -p $out
      cp -r . $out/
    '';

    meta = with pkgs.lib; {
      description = "Doge Prize Client";
      homepage = "https://github.com/dogecoinfoundation/doge-prize";
      license = licenses.mit;
      platforms = platforms.unix;
    };
  };

  run-script = pkgs.writeScriptBin "run.sh" ''
    #!${pkgs.stdenv.shell}

    cd ${doge-prize-client}

    export NODE_ENV=production
    export CONFIG_ENV=production
    export PORT=3643
    export HOSTNAME=0.0.0.0

    ${pkgs.nodejs_22}/bin/node ${doge-prize-client}/node_modules/.bin/next start -p $PORT -H $HOSTNAME
  '';

in
{
  "doge-prize-client" = run-script;
}
