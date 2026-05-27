// src/components/invoices/invoice-items.tsx
"use client"

import { useState } from "react"

export type InvoiceItemInput = {
  description: string
  quantity: number
  unitPrice: number
}

type Props = {
  initialItems?: InvoiceItemInput[]
}

export function InvoiceItems({ initialItems }: Props) {
  const [items, setItems] = useState<InvoiceItemInput[]>(
    initialItems && initialItems.length > 0
      ? initialItems
      : [{ description: "", quantity: 1, unitPrice: 0 }]
  )

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])
  }

  function removeItem(index: number) {
    if (items.length === 1) return // مفروض يكون فيه سطر واحد على الأقل
    setItems(items.filter((_, i) => i !== index))
  }

  function handleChange(index: number, field: keyof InvoiceItemInput, value: string | number) {
    const newItems = [...items]
    if (field === "description") {
      newItems[index].description = value as string
    } else {
      newItems[index][field] = Number(value) || 0
    }
    setItems(newItems)
  }

  // حساب الإجمالي للعرض فقط (السيرفر هيعيد الحساب عشان الأمان)
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Invoice Items</h3>
        <button
          type="button"
          onClick={addItem}
          className="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          + Add Item
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-start">
            {/* Description */}
            <div className="col-span-6">
              {index === 0 && <label className="block text-xs text-gray-500 mb-1">Description</label>}
              <input
                type="text"
                name={`items[${index}][description]`}
                value={item.description}
                onChange={(e) => handleChange(index, "description", e.target.value)}
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Consultation, X-ray..."
              />
            </div>

            {/* Quantity */}
            <div className="col-span-2">
              {index === 0 && <label className="block text-xs text-gray-500 mb-1">Qty</label>}
              <input
                type="number"
                name={`items[${index}][quantity]`}
                value={item.quantity}
                onChange={(e) => handleChange(index, "quantity", e.target.value)}
                required
                min="1"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Unit Price */}
            <div className="col-span-3">
              {index === 0 && <label className="block text-xs text-gray-500 mb-1">Price</label>}
              <input
                type="number"
                name={`items[${index}][unitPrice]`}
                value={item.unitPrice}
                onChange={(e) => handleChange(index, "unitPrice", e.target.value)}
                required
                min="0"
                step="0.01"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Remove Button */}
            <div className="col-span-1 flex items-center justify-center pt-1">
              {index === 0 ? (
                <div className="h-8"></div> // مسافة فارغة عشان يبقى شكل الجدول مظبوط
              ) : (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="h-8 w-8 rounded-md text-red-500 hover:bg-red-50 flex items-center justify-center"
                >
                  X
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total Amount Preview */}
      <div className="flex justify-end border-t pt-3">
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}