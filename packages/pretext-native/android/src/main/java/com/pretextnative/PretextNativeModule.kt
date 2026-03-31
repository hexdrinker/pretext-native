package com.pretextnative

import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import java.util.concurrent.Executors

@ReactModule(name = PretextNativeModule.NAME)
class PretextNativeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val fontCache = FontMetricsCache()
    private val textMeasurer = TextMeasurer(fontCache)
    private val executor = Executors.newSingleThreadExecutor()

    override fun getName(): String = NAME

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun measureTextSync(input: ReadableMap): WritableMap {
        return textMeasurer.measure(input)
    }

    @ReactMethod
    fun measureText(input: ReadableMap, promise: Promise) {
        executor.execute {
            try {
                val result = textMeasurer.measure(input)
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("MEASURE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun measureTextBatch(inputs: ReadableArray, promise: Promise) {
        executor.execute {
            try {
                val results = Arguments.createArray()
                for (i in 0 until inputs.size()) {
                    val input = inputs.getMap(i) ?: continue
                    results.pushMap(textMeasurer.measure(input))
                }
                promise.resolve(results)
            } catch (e: Exception) {
                promise.reject("BATCH_MEASURE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getFontMetrics(fontFamily: String, fontWeight: String, fontSize: Double): WritableMap {
        val paint = fontCache.getPaint(fontFamily, fontWeight, fontSize.toFloat())
        val metrics = paint.fontMetrics

        val result = Arguments.createMap()
        // Approximations — Android does not expose capHeight/xHeight directly
        result.putDouble("capHeight", (-metrics.ascent * 0.7).toDouble())
        result.putDouble("ascender", (-metrics.ascent).toDouble())
        result.putDouble("descender", metrics.descent.toDouble())
        result.putDouble("xHeight", (-metrics.ascent * 0.5).toDouble())
        result.putDouble("lineGap", metrics.leading.toDouble())
        result.putDouble("unitsPerEm", 1000.0)
        return result
    }

    @ReactMethod
    fun clearCache() {
        fontCache.clear()
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getCacheStats(): WritableMap {
        val result = Arguments.createMap()
        result.putInt("fontMetricsEntries", fontCache.size)
        result.putInt("measurementEntries", 0)
        result.putDouble("hitRate", 0.0)
        return result
    }

    companion object {
        const val NAME = "PretextNative"
    }
}
