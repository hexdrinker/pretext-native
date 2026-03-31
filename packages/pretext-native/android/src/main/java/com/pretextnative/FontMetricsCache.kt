package com.pretextnative

import android.graphics.Typeface
import android.text.TextPaint
import android.util.LruCache

/**
 * Caches TextPaint instances keyed by (fontFamily, fontWeight, fontSize).
 * TextPaint creation involves Typeface resolution which is expensive.
 */
class FontMetricsCache(maxSize: Int = 50) {
    private val paintCache = LruCache<String, TextPaint>(maxSize)

    fun getPaint(fontFamily: String?, fontWeight: String?, fontSize: Float): TextPaint {
        val key = "${fontFamily ?: "system"}|${fontWeight ?: "400"}|$fontSize"
        return paintCache.get(key) ?: buildPaint(fontFamily, fontWeight, fontSize).also {
            paintCache.put(key, it)
        }
    }

    fun clear() {
        paintCache.evictAll()
    }

    val size: Int get() = paintCache.size()

    private fun buildPaint(fontFamily: String?, fontWeight: String?, fontSize: Float): TextPaint {
        val style = when (fontWeight) {
            "700", "800", "900", "bold" -> Typeface.BOLD
            else -> Typeface.NORMAL
        }

        val typeface = if (!fontFamily.isNullOrEmpty()) {
            try {
                Typeface.create(fontFamily, style)
            } catch (_: Exception) {
                Typeface.create(Typeface.DEFAULT, style)
            }
        } else {
            Typeface.create(Typeface.DEFAULT, style)
        }

        return TextPaint().apply {
            this.typeface = typeface
            textSize = fontSize
            isAntiAlias = true
        }
    }
}
