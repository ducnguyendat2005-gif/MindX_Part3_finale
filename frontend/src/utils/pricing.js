export function getCoursePricing(course = {}) {
  const originalPrice = Number(course.originalPrice ?? course.price) || 0;
  const promotionalPrice = Number(course.promotionalPrice);
  const hasDiscount = Number.isFinite(promotionalPrice)
    && promotionalPrice > 0
    && promotionalPrice < originalPrice;
  const salePrice = hasDiscount ? promotionalPrice : originalPrice;

  return {
    originalPrice,
    salePrice,
    discountAmount: Math.max(originalPrice - salePrice, 0),
  };
}

// Lưu giá bán thực tế khi thêm vào giỏ, đồng thời giữ lại giá gốc để hiển thị Discount.
export function normalizeCartItem(course = {}) {
  const { originalPrice, salePrice, discountAmount } = getCoursePricing(course);

  return {
    ...course,
    price: salePrice,
    originalPrice,
    discountAmount,
  };
}
