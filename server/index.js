const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9",
};

async function scrapeVinted(query, size = "") {
  try {
    const searchQuery = encodeURIComponent(`${query} ${size}`.trim());
    const url = `https://www.vinted.fr/catalog?search_text=${searchQuery}&order=relevance`;
    const response = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(response.data);
    const prices = [];
    const items = [];

    $('[data-testid="regular-item-box"]').each((i, el) => {
      const priceText = $(el).find('[data-testid="item-price"]').text().trim();
      const title = $(el).find('[data-testid="item-title"]').text().trim();
      const brand = $(el).find('[data-testid="item-details-brand"]').text().trim();
      const size = $(el).find('[data-testid="item-details-size"]').text().trim();
      const condition = $(el).find('[data-testid="item-details-condition"]').text().trim();
      const link = $(el).find("a").attr("href");
      const priceMatch = priceText.match(/[\d,\.]+/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[0].replace(",", "."));
        if (price > 0 && price < 500) {
          prices.push(price);
          items.push({ price, title: title || query, brand, size, condition, link: link ? `https://www.vinted.fr${link}` : null });
        }
      }
    });

    if (items.length === 0) {
      $(".feed-grid__item").each((i, el) => {
        const priceText = $(el).find(".price-tag").text().trim();
        const title = $(el).find(".item-box__title").text().trim();
        const priceMatch = priceText.match(/[\d,\.]+/);
        if (priceMatch) {
          const price = parseFloat(priceMatch[0].replace(",", "."));
          if (price > 0 && price < 500) {
            prices.push(price);
            items.push({ price, title: title || query });
          }
        }
      });
    }

    return { prices, items: items.slice(0, 20) };
  } catch (error) {
    console.error("Erreur scraping Vinted:", error.message);
    return { prices: [], items: [] };
  }
}

async function scrapeVintedItem(url) {
  try {
    const response = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(response.data);
    const title = $('[itemprop="name"]').first().text().trim() || $("h1").first().text().trim();
    const priceText = $('[itemprop="price"]').attr("content") || $('[data-testid="item-price"]').text().trim();
    const brand = $('[data-testid="item-attribute-brand"]').text().trim() || $('[itemprop="brand"]').text().trim();
    const size = $('[data-testid="item-attribute-size"]').text().trim();
    const condition = $('[data-testid="item-attribute-condition"]').text().trim();
    const shippingText = $('[data-testid="item-shipping-price"]').text().trim();
    const shippingMatch = shippingText.match(/[\d,\.]+/);
    const shipping = shippingMatch ? parseFloat(shippingMatch[0].replace(",", ".")) : 3.99;
    const price = parseFloat(priceText) || 0;
    const buyerFees = price > 0 ? parseFloat(Math.max(0.70, price * 0.05 + 0.70).toFixed(2)) : 0;
    return { title, brand, size, condition, price, shipping, buyerFees, totalCost: parseFloat((price + shipping + buyerFees).toFixed(2)) };
  } catch (error) {
    console.error("Erreur scraping item:", error.message);
    return null;
  }
}

async function analyzeWithGroq(itemInfo, marketData) {
  const systemPrompt = `Tu es un expert en flip Vinted. Retourne UNIQUEMENT ce JSON sans texte autour :
{
  "produit": { "marque": "...", "modele": "...", "taille": "...", "etat": "...", "confiance": 90 },
  "marche": { "prix_minimum": 0, "prix_median": 0, "prix_maximum": 0, "nombre_annonces": 0, "delai_revente_jours": 0, "demande": "forte" },
  "achat": { "prix_article": 0, "frais_livraison": 0, "frais_protection": 0, "cout_total_reel": 0 },
  "revente": { "prix_revente_conseille": 0, "prix_revente_min": 0, "prix_revente_max": 0, "marge_nette": 0, "rentabilite_pct": 0 },
  "verdict": { "decision": "ACHETE", "raison": "...", "prix_negociation_ideal": 0, "prix_negociation_minimum": 0, "prix_negociation_maximum": 0, "conseil": "..." }
}
RÈGLES : Base toi sur les prix réels fournis. Marge réaliste 4-15€. Decision = ACHETE, NEGOCIE, ou PASSE uniquement.`;

  const userPrompt = `Article: ${itemInfo.title || ""} ${itemInfo.brand || ""}
Taille: ${itemInfo.size || ""} | État: ${itemInfo.condition || ""}
Prix: ${itemInfo.price}€ | Livraison: ${itemInfo.shipping}€ | Protection: ${itemInfo.buyerFees}€
COÛT TOTAL: ${itemIn
