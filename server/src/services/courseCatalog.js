import { Category } from '../models/Category.js';
import { Course } from '../models/Course.js';

export async function getCategoriesWithCounts({ sortByCount = false, limit } = {}) {
  const [categories, counts] = await Promise.all([
    Category.find().sort(sortByCount ? { courseCount: -1, name: 1 } : { name: 1 }),
    Course.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$categoryId', courseCount: { $sum: 1 } } },
    ]),
  ]);

  const countMap = new Map(counts.map((row) => [row._id?.toString(), row.courseCount]));

  let result = categories.map((cat) => ({
    ...cat.toObject(),
    courseCount: countMap.get(cat._id.toString()) || 0,
  }));

  if (sortByCount) {
    result = result.sort((a, b) => b.courseCount - a.courseCount || a.name.localeCompare(b.name));
  }

  if (limit) result = result.slice(0, limit);
  return result;
}

export function buildCourseFilter({ q, categoryId, price, minRating } = {}) {
  const and = [{ status: 'published' }];

  if (categoryId) and.push({ categoryId });
  if (minRating) and.push({ rating: { $gte: Number(minRating) } });

  if (price === 'free') and.push({ $or: [{ isFree: true }, { price: 0 }] });
  else if (price === 'paid') and.push({ isFree: false, price: { $gt: 0 } });

  if (q) {
    and.push({
      $or: [{ title: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }],
    });
  }

  return and.length === 1 ? and[0] : { $and: and };
}

export function getCourseSort(sort) {
  switch (sort) {
    case 'newest':
      return { createdAt: -1 };
    case 'price-asc':
      return { price: 1, createdAt: -1 };
    case 'price-desc':
      return { price: -1, createdAt: -1 };
    case 'rating':
      return { rating: -1, reviewCount: -1, studentCount: -1 };
    case 'popular':
    default:
      return { studentCount: -1, rating: -1, createdAt: -1 };
  }
}
