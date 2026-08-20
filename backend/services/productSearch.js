const Product = require('../models/Product');

// Bounds how many ids each branch pulls back before ranking/pagination —
// keeps a very broad search cheap. Real users essentially never page this
// deep, so nothing meaningful is lost by capping the long tail.
const MATCH_ID_CAP = 2000;

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function idsFor(query, cap = MATCH_ID_CAP) {
  const docs = await Product.find(query).select('_id').limit(cap);
  return docs.map(d => d._id);
}

/**
 * Ranked product search.
 *
 * Combines two signals:
 *  - a weighted MongoDB text-index match on name/brand/tags/description
 *    (see the text index in models/Product.js) — whole/stemmed word matches,
 *    scored so a name hit ranks far above an incidental description mention.
 *  - a plain substring match on `name` — catches partial words (e.g. "iphon")
 *    that the text index's whole-word/stemmed matching would miss entirely.
 *
 * In "relevance" mode (the default when the caller hasn't picked another
 * sort), text matches come first ordered by textScore, with partial-only
 * matches appended after, ordered by name — i.e. "what you specifically
 * searched for" before "close/partial matches".
 *
 * When the caller has chosen an explicit sort (price, name, rating, ...),
 * the full deduped union of both branches is sorted by that field as one
 * list, so e.g. "Price: Low to High" reflects the whole matched set rather
 * than "text matches first, then partial matches" regardless of price.
 */
async function searchProductsRanked({ baseQuery, searchTerm, sortBy, wantsRelevance, skip, limit, isAdmin }) {
  const textQuery = { ...baseQuery, $text: { $search: searchTerm } };
  const partialQuery = { ...baseQuery, name: { $regex: escapeRegex(searchTerm), $options: 'i' } };
  const selectFields = isAdmin ? undefined : '-backendPrice';

  if (wantsRelevance) {
    const textTotal = await Product.countDocuments(textQuery);

    let textDocs = [];
    if (skip < textTotal) {
      const q = Product.find(textQuery, { score: { $meta: 'textScore' } });
      if (selectFields) q.select(selectFields);
      textDocs = await q
        .populate('categories', 'name slug')
        // _id tie-break: MongoDB doesn't guarantee a stable order among equal
        // textScores, so without one, skip/limit pagination can reshuffle or
        // repeat tied documents across pages.
        .sort({ score: { $meta: 'textScore' }, _id: 1 })
        .skip(skip)
        .limit(limit);
    }

    const remaining = limit - textDocs.length;
    let partialDocs = [];
    let partialTotal = 0;
    if (remaining > 0) {
      const excludeIds = await idsFor(textQuery);
      const excludedPartialQuery = { ...partialQuery, _id: { $nin: excludeIds } };
      partialTotal = await Product.countDocuments(excludedPartialQuery);
      const partialSkip = Math.max(0, skip - textTotal);
      if (partialSkip < partialTotal) {
        const q = Product.find(excludedPartialQuery);
        if (selectFields) q.select(selectFields);
        partialDocs = await q
          .populate('categories', 'name slug')
          .sort({ name: 1, _id: 1 })
          .skip(partialSkip)
          .limit(remaining);
      }
    }

    return { products: [...textDocs, ...partialDocs], total: textTotal + partialTotal };
  }

  // Explicit non-relevance sort — union both branches into one id set first,
  // then sort/paginate that as a single list.
  const [textIds, partialIds] = await Promise.all([idsFor(textQuery), idsFor(partialQuery)]);
  const combinedIds = [...new Set([...textIds, ...partialIds].map(String))];
  const total = combinedIds.length;

  const q = Product.find({ _id: { $in: combinedIds } });
  if (selectFields) q.select(selectFields);
  const products = await q
    .populate('categories', 'name slug')
    .sort(`${sortBy} _id`) // _id tie-break, same reason as the relevance branch above
    .skip(skip)
    .limit(limit);

  return { products, total };
}

module.exports = { searchProductsRanked };
