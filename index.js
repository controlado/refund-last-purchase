import { sendChatNotification, addRoutines, Champion, sleep } from "../controladoUtils";
import { Store } from "./requests";
import "./assets/style.css";

/**
 * @author balaclava
 * @name refund-last-purchase
 * @link https://github.com/controlado/refund-last-purchase
 * @description Play with a champion for free! 🐧
 */

const buttonConfig = {
  id: "refund-last-purchase",
  defaultMode: "refund",
  text: {
    default: "Refund",
    refund: "Refund Last Champion",
    buy: "Buy Last Refunded Champion",
  },
};

function onMutation() {
  const championSelectButtons = document.querySelector(".bottom-right-buttons");
  if (!championSelectButtons || document.querySelector(`#${buttonConfig.id}`)) { return; }

  const store = new Store();
  const buyChampionButton = document.createElement("lol-uikit-flat-button");
  buyChampionButton.classList.add("buy-champion-button");
  buyChampionButton.textContent = buttonConfig.text.default;
  buyChampionButton.mode = buttonConfig.defaultMode;
  buyChampionButton.id = buttonConfig.id;

  buyChampionButton.onclick = async () => {
    buyChampionButton.setAttribute("disabled", "true");
    const purchaseHistory = await store.getPurchaseHistory();
    try {
      if (buyChampionButton.mode === "refund") {
        const response = await store.refundLastChampion(purchaseHistory);
        await sendChatNotification(`Refund: ${response.statusText} (${response.status})`);
      }
      else {
        const item = purchaseHistory.find(item => item.currencyType === "IP" && item.inventoryType === "CHAMPION" && item.refundabilityMessage === "ALREADY_REFUNDED");
        const response = await store.buyChampions(new Champion(item.itemId, item.amountSpent));
        await sendChatNotification(`Purchase: ${response.statusText} (${response.status})`);
      }
    }
    catch (error) { await sendChatNotification("An error occurred."); }
    finally { buyChampionButton.removeAttribute("disabled"); }
  };
  buyChampionButton.oncontextmenu = () => {
    buyChampionButton.mode = buyChampionButton.mode === "refund" ? "buy" : "refund";
    buyChampionButton.textContent = buttonConfig.text[buyChampionButton.mode];
  };
  buyChampionButton.onmouseenter = () => buyChampionButton.textContent = buttonConfig.text[buyChampionButton.mode];
  buyChampionButton.onmouseleave = () => buyChampionButton.textContent = buttonConfig.text.default;

  sleep(1000).then(() => { // @teisseire117 - league-loader-plugins/dodge_button
    if (document.querySelector(".dodge-button-container")) {
      sendChatNotification("Identified dodge-button!");
      buyChampionButton.style.bottom = "96px";
    }
    championSelectButtons.parentNode.insertBefore(buyChampionButton, championSelectButtons);
  });
}

window.addEventListener("load", () => {
  console.debug("Refund Last Purchase: Report bugs to Balaclava#1912");
  addRoutines(onMutation);
});
