// ============================================================
// ProductLens AI — Locked System Prompt for Gemini 1.5 Pro
// This file is immutable. Do not modify the prompt text.
// ============================================================

export const EXTRACTION_PROMPT = `Please analyze the video from start to finish, second by second, and provide a complete text breakdown of every feature shown on both the Amazon listing and the official website in the exact same order they appear in the video.

Please keep all features exactly the way they are shown in the video. Do not shorten, summarize, rewrite, or simplify any text on your own. Whatever text appears on the websites should be provided exactly in the same format and wording.

If there are 10 lines of text, then provide all 10 lines exactly as they appear. Do not make the content shorter or condensed in any way.

Preserve the sequence exactly as shown, and make sure no feature, image text, title, description, or A+ content detail is missed. I need every single piece of information exactly as presented in the video. This ensures that the transcription remains perfectly faithful to the source material.

Follow the exact structural format provided in the TARGET OUTPUT FORMAT EXAMPLE below.

---

TARGET OUTPUT FORMAT EXAMPLE:

### [00:01 - 00:45] AMAZON PRODUCT LISTING - HERO SECTION
- **Product Title:** iRobot Roomba Max 705X Robot Vacuum & Mop Combo
- **Rating Badge:** 4.7 out of 5 stars | 12,450 ratings
- **Price Block:** Was: $599.99 | Price: $449.99 (25% OFF)
- **Key Bullet Points (Verbatim):**
  * PowerSpin Technology delivers 175X more suction compared to standard 600 series models.
  * Advanced Smart Mapping 3.0 learns your entire home layout in just 1 single cleaning run.
  * Dual Multi-Surface Rubber Brushes resist pet hair tangles completely.

### [00:46 - 02:30] AMAZON A+ MANUFACTURER CONTENT (MANUALLY CLICKED TABS)
- **Section 1 Banner Headline:** "Deep Clean, Every Day. Fully Automated."
- **Interactive Tab 1 Title: [PET HAIR SOLUTION]**
  * *Exposed Text:* "Our patented dual rubber brushes flex to stay in constant contact with carpets and hard floors. Ideal for homes with heavy shedding pets."
- **Interactive Tab 2 Title: [3-STAGE CLEANING SYSTEM]**
  * *Exposed Text:* "Loosens, lifts, and suctions stubborn dirt with edge-sweeping brushes and high-efficiency filtration capturing 99.9% of allergens."
- **Technical Specifications Grid Box (Verbatim):**
  * Model Number: R705X40
  * Battery Rating: 5200mAh Lithium-Ion
  * Dimensions: 13.8 x 13.8 x 3.6 inches
  * Item Weight: 7.5 lbs
  * UPC Code: 885155019822

### [02:31 - 04:15] OFFICIAL BRAND WEBSITE (IROBOT.COM/MAX705X)
- **Top Announcement Bar:** "Free Shipping on orders over $50 + 30-Day Money-Back Guarantee."
- **Main Panel Slide 1 Narrative:** "The future of automated floor care is here. Max 705X introduces real-time obstacle avoidance using localized AI profiling."
- **Fine-Print Footnotes & Certifications (Verbatim):**
  * *Footnote 1:* Based on internal testing against leading competitors on hard floors.
  * *Footnote 2:* Requires 2.4GHz Wi-Fi network connection for initial mapping configuration.
  * *Metric:* Max washing temperature up to 161°F. Max drying temperature up to 122°F.`;

export const GEMINI_MODEL = 'gemini-1.5-pro';
