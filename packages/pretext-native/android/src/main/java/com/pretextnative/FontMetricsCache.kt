package com.pretextnative

import android.graphics.Typeface
import android.os.Build
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

    private fun parseWeight(fontWeight: String?): Int {
        return when (fontWeight) {
            "100" -> 100
            "200" -> 200
            "300" -> 300
            "400", "normal", null -> 400
            "500" -> 500
            "600" -> 600
            "700", "bold" -> 700
            "800" -> 800
            "900" -> 900
            else -> fontWeight?.toIntOrNull() ?: 400
        }
    }

    private fun buildPaint(fontFamily: String?, fontWeight: String?, fontSize: Float): TextPaint {
        val weight = parseWeight(fontWeight)

        val typeface = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            // API 28+: supports fine-grained weight (100-900)
            val base = if (!fontFamily.isNullOrEmpty()) {
                try {
                    Typeface.create(fontFamily, Typeface.NORMAL)
                } catch (_: Exception) {
                    Typeface.DEFAULT
                }
            } else {
                Typeface.DEFAULT
            }
            Typeface.create(base, weight, false)
        } else {
            // Pre-API 28: only NORMAL/BOLD
            val style = if (weight >= 700) Typeface.BOLD else Typeface.NORMAL
            if (!fontFamily.isNullOrEmpty()) {
                try {
                    Typeface.create(fontFamily, style)
                } catch (_: Exception) {
                    Typeface.create(Typeface.DEFAULT, style)
                }
            } else {
                Typeface.create(Typeface.DEFAULT, style)
            }
        }

        return TextPaint().apply {
            this.typeface = typeface
            textSize = fontSize
            isAntiAlias = true
        }
    }
}
