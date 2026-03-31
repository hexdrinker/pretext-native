package com.pretextnative

import android.os.Build
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import kotlin.math.ceil

/**
 * Measures text using Android's StaticLayout engine.
 * Produces identical line-break results to React Native's own text rendering.
 */
class TextMeasurer(private val fontCache: FontMetricsCache) {

    fun measure(input: ReadableMap): WritableMap {
        val text = input.getString("text") ?: ""
        val width = input.getDouble("width").toFloat()
        val fontSize = input.getDouble("fontSize").toFloat()
        val fontFamily = if (input.hasKey("fontFamily")) input.getString("fontFamily") else null
        val fontWeight = if (input.hasKey("fontWeight")) input.getString("fontWeight") else null
        val lineHeight = if (input.hasKey("lineHeight")) input.getDouble("lineHeight").toFloat() else null
        val letterSpacing = if (input.hasKey("letterSpacing")) input.getDouble("letterSpacing").toFloat() else null
        val maxLines = if (input.hasKey("maxLines")) input.getInt("maxLines") else null

        val paint = fontCache.getPaint(fontFamily, fontWeight, fontSize)

        if (letterSpacing != null) {
            paint.letterSpacing = letterSpacing / fontSize // Android uses em units
        }

        // Calculate line spacing
        val spacingMultiplier = if (lineHeight != null) {
            lineHeight / paint.getFontMetrics(null)
        } else {
            1.3f
        }

        val layout = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            StaticLayout.Builder
                .obtain(text, 0, text.length, paint, width.toInt().coerceAtLeast(1))
                .setAlignment(Layout.Alignment.ALIGN_NORMAL)
                .setLineSpacing(0f, spacingMultiplier)
                .setIncludePad(false)
                .build()
        } else {
            @Suppress("DEPRECATION")
            StaticLayout(
                text, paint, width.toInt().coerceAtLeast(1),
                Layout.Alignment.ALIGN_NORMAL, spacingMultiplier, 0f, false
            )
        }

        val lineCount = layout.lineCount
        val lines = Arguments.createArray()

        for (i in 0 until lineCount) {
            val lineStart = layout.getLineStart(i)
            val lineEnd = layout.getLineEnd(i)
            var lineText = text.substring(lineStart, lineEnd)
            // Trim trailing newline
            if (lineText.endsWith("\n")) {
                lineText = lineText.dropLast(1)
            }
            lines.pushString(lineText)
        }

        var finalLineCount = lineCount
        var truncated = false
        var height = ceil(layout.height.toDouble())

        // Apply maxLines truncation
        if (maxLines != null && maxLines > 0 && lineCount > maxLines) {
            truncated = true
            finalLineCount = maxLines

            // Rebuild lines array with only maxLines entries
            val truncatedLines = Arguments.createArray()
            for (i in 0 until maxLines) {
                val lineStart = layout.getLineStart(i)
                val lineEnd = layout.getLineEnd(i)
                var lineText = text.substring(lineStart, lineEnd)
                if (lineText.endsWith("\n")) {
                    lineText = lineText.dropLast(1)
                }
                truncatedLines.pushString(lineText)
            }

            // Recalculate height
            height = if (lineHeight != null) {
                (maxLines * lineHeight).toDouble()
            } else {
                ceil(layout.getLineBottom(maxLines - 1).toDouble())
            }

            val result = Arguments.createMap()
            result.putDouble("height", height)
            result.putInt("lineCount", finalLineCount)
            result.putArray("lines", truncatedLines)
            result.putBoolean("truncated", truncated)
            return result
        }

        // Handle empty text
        if (lineCount == 0) {
            lines.pushString("")
            finalLineCount = 1
        }

        val result = Arguments.createMap()
        result.putDouble("height", height)
        result.putInt("lineCount", finalLineCount)
        result.putArray("lines", lines)
        result.putBoolean("truncated", truncated)
        return result
    }
}
