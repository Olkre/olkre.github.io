import bolt from "./bolt.png";
import boltSilhouette from "./bolt_silhouette.png";
import friends from "./friends.png";
import friendsSilhouette from "./friends_silhouette.png";
import timer from "./timer.png";
import timerSilhouette from "./timer_silhouette.png";

export const newBenefitMetalImages = {
  bolt: bolt.src,
  friends: friends.src,
  timer: timer.src,
} as const;

export const newBenefitSilhouetteImages = {
  bolt: boltSilhouette.src,
  friends: friendsSilhouette.src,
  timer: timerSilhouette.src,
} as const;

/** Native pixel size per mark (width varies; height is 880 for all). */
export const newBenefitImageSize = {
  bolt: { width: bolt.width, height: bolt.height },
  friends: { width: friends.width, height: friends.height },
  timer: { width: timer.width, height: timer.height },
} as const;
