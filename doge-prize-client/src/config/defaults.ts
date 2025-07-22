export interface Config {
  title: string;
  subtitle: string;
  pageTitle: string;
  pageDescription: string;
  prizeHeading: string;
  serverHeading: string;
  serverPlaceholder: string;
  redemptionCodeHeading: string;
  redemptionCodePlaceholder: string;
  redeemButtonText: string;
  footerText: string;
  footerTextPosition: "above" | "below";
  footerImage: string;
  footerUrl: string;
  backgroundImage: string;
  logoImage: string;
  showWave: boolean;
  panelAlignment: "left" | "center" | "right";
}

// Shared default configuration values
export const defaultConfig: Config = {
  title: "Doge Prize",
  subtitle: "Prizes in Dogecoin!",
  pageTitle: "Doge Prize",
  pageDescription: "Redeem your Dogecoin prizes. Enter your redemption code to claim your Ð rewards!",
  prizeHeading: "Enter your code below to reveal your prize!",
  serverHeading: "Server address",
  serverPlaceholder: "Enter Server address",
  redemptionCodeHeading: "Redemption Code",
  redemptionCodePlaceholder: "Enter redemption code",
  redeemButtonText: "Look inside",
  footerText: "",
  footerTextPosition: "below",
  footerImage: "/footer.png",
  footerUrl: "https://dogecoin.com",
  backgroundImage: "",
  logoImage: "",
  showWave: false,
  panelAlignment: "left"
}; 