import { prisma } from '@/lib/prisma';

interface QuoteInput {
  category_id: number;
  invoice_value: number;
  duration_months: number;
  addon_ids?: number[];
  discount_code?: string;
}

export async function calculateQuote(data: QuoteInput) {
  const { category_id, invoice_value, duration_months, addon_ids = [], discount_code } = data;

  // Find pricing slab
  const slab = await prisma.pricingSlab.findFirst({
    where: {
      categoryId: category_id,
      minValue: { lte: invoice_value },
      maxValue: { gte: invoice_value },
      status: 'ACTIVE',
    },
  });

  if (!slab) {
    throw new Error('No pricing slab found for this invoice value');
  }

  // Calculate base premium
  const basePremium = Number(slab.basePremium);
  
  // Apply duration multiplier
  const multipliers = slab.durationMultiplier as any;
  const durationMultiplier = multipliers[duration_months.toString()] || 1;
  const premiumAfterDuration = basePremium * durationMultiplier;

  // Calculate addons total
  let addonsTotal = 0;
  const addonDetails: any[] = [];

  if (addon_ids.length > 0) {
    const addons = await prisma.addon.findMany({
      where: {
        id: { in: addon_ids },
        status: 'ACTIVE',
      },
    });

    for (const addon of addons) {
      let addonPrice = 0;
      if (addon.priceType === 'FIXED') {
        addonPrice = Number(addon.priceValue);
      } else {
        addonPrice = (premiumAfterDuration * Number(addon.priceValue)) / 100;
      }

      addonsTotal += addonPrice;
      addonDetails.push({
        addon_id: addon.id,
        name: addon.name,
        price: Math.round(addonPrice * 100) / 100,
      });
    }
  }

  // Calculate subtotal
  const subtotal = premiumAfterDuration + addonsTotal;

  // Apply discount
  let discount = 0;
  if (discount_code) {
    discount = calculateDiscount(discount_code, subtotal);
  }

  const amountAfterDiscount = subtotal - discount;

  // Calculate GST
  const gstRate = Number(slab.gstRate);
  const gstAmount = (amountAfterDiscount * gstRate) / 100;

  // Calculate grand total
  const grandTotal = amountAfterDiscount + gstAmount;

  return {
    base_premium: Math.round(basePremium * 100) / 100,
    duration_multiplier: durationMultiplier,
    premium_after_duration: Math.round(premiumAfterDuration * 100) / 100,
    addons: addonDetails,
    addons_total: Math.round(addonsTotal * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    discount_code,
    amount_after_discount: Math.round(amountAfterDiscount * 100) / 100,
    gst_rate: gstRate,
    gst_amount: Math.round(gstAmount * 100) / 100,
    grand_total: Math.round(grandTotal * 100) / 100,
    commission_percent: Number(slab.commissionPercent),
    slab_id: slab.id,
  };
}

function calculateDiscount(code: string, amount: number): number {
  const discounts: Record<string, number> = {
    'WELCOME10': 10,
    'SAVE500': 500,
  };

  if (discounts[code]) {
    const discountValue = discounts[code];
    if (discountValue > 100) {
      return Math.min(discountValue, amount);
    } else {
      return (amount * discountValue) / 100;
    }
  }

  return 0;
}