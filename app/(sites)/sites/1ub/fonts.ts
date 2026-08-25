import { Changa_One } from "next/font/google";
import localFont from "next/font/local";

// GT Walsheim: the DDB Lagos deck's workhorse face. Self-hosted from the same
// files the presentation deck already ships, so the microsite and the deck
// read as one brand rather than two typefaces improvising a resemblance.
export const gtWalsheim = localFont({
  src: [
    {
      path: "../../../../public/sites/1ub/campaign/deck/uploads/gt-walsheim-thin-web.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../../../public/sites/1ub/campaign/deck/uploads/gt-walsheim-light-web.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../../../public/sites/1ub/campaign/deck/uploads/gt-walsheim-regular-web.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../../public/sites/1ub/campaign/deck/uploads/gt-walsheim-medium-web.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../../public/sites/1ub/campaign/deck/uploads/gt-walsheim-bold-web.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../../../public/sites/1ub/campaign/deck/uploads/gt-walsheim-black-web.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

// Changa One: reserved for the one or two biggest display moments per page,
// exactly as the deck uses it for its cover and section headlines.
export const changaOne = Changa_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});
