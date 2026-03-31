#import "PretextNative.h"
#import <React/RCTLog.h>
#import <CoreText/CoreText.h>
#import <UIKit/UIKit.h>

#pragma mark - Font Cache (thread-safe)

static NSMutableDictionary<NSString *, UIFont *> *fontCache;
static dispatch_once_t fontCacheOnceToken;

static UIFont *getCachedFont(NSString *fontFamily, NSString *fontWeight, CGFloat fontSize) {
    dispatch_once(&fontCacheOnceToken, ^{
        fontCache = [NSMutableDictionary new];
    });

    NSString *key = [NSString stringWithFormat:@"%@|%@|%f", fontFamily ?: @"system", fontWeight ?: @"400", fontSize];

    @synchronized(fontCache) {
        UIFont *cached = fontCache[key];
        if (cached) return cached;

        UIFont *font;
        UIFontWeight weight = UIFontWeightRegular;

        if (fontWeight) {
            NSDictionary *weightMap = @{
                @"100": @(UIFontWeightUltraLight),
                @"200": @(UIFontWeightThin),
                @"300": @(UIFontWeightLight),
                @"400": @(UIFontWeightRegular),
                @"500": @(UIFontWeightMedium),
                @"600": @(UIFontWeightSemibold),
                @"700": @(UIFontWeightBold),
                @"800": @(UIFontWeightHeavy),
                @"900": @(UIFontWeightBlack),
                @"bold": @(UIFontWeightBold),
                @"normal": @(UIFontWeightRegular),
            };
            NSNumber *mappedWeight = weightMap[fontWeight];
            if (mappedWeight) weight = [mappedWeight floatValue];
        }

        if (fontFamily && fontFamily.length > 0) {
            font = [UIFont fontWithName:fontFamily size:fontSize];
            if (!font) {
                font = [UIFont systemFontOfSize:fontSize weight:weight];
            }
        } else {
            font = [UIFont systemFontOfSize:fontSize weight:weight];
        }

        fontCache[key] = font;
        return font;
    }
}

#pragma mark - Text Measurement (CoreText — thread-safe)

static NSDictionary *measureTextWithInput(NSDictionary *input) {
    NSString *text = input[@"text"] ?: @"";
    double width = [input[@"width"] doubleValue];
    double fontSize = [input[@"fontSize"] doubleValue];
    NSString *fontFamily = input[@"fontFamily"];
    NSString *fontWeight = input[@"fontWeight"];
    NSNumber *lineHeightNum = input[@"lineHeight"];
    NSNumber *letterSpacingNum = input[@"letterSpacing"];
    NSNumber *maxLinesNum = input[@"maxLines"];

    UIFont *font = getCachedFont(fontFamily, fontWeight, fontSize);
    CTFontRef ctFont = (__bridge CTFontRef)font;

    // Build attributes
    NSMutableDictionary *attrDict = [NSMutableDictionary new];
    attrDict[(__bridge id)kCTFontAttributeName] = (__bridge id)ctFont;

    if (letterSpacingNum) {
        attrDict[(__bridge id)kCTKernAttributeName] = letterSpacingNum;
    }

    // Paragraph style
    CGFloat lineHeight = lineHeightNum ? [lineHeightNum doubleValue] : 0;
    CTParagraphStyleSetting settings[3];
    int settingCount = 0;

    CTLineBreakMode lineBreakMode = kCTLineBreakByWordWrapping;
    settings[settingCount++] = (CTParagraphStyleSetting){
        .spec = kCTParagraphStyleSpecifierLineBreakMode,
        .valueSize = sizeof(lineBreakMode),
        .value = &lineBreakMode,
    };

    if (lineHeight > 0) {
        settings[settingCount++] = (CTParagraphStyleSetting){
            .spec = kCTParagraphStyleSpecifierMinimumLineHeight,
            .valueSize = sizeof(lineHeight),
            .value = &lineHeight,
        };
        settings[settingCount++] = (CTParagraphStyleSetting){
            .spec = kCTParagraphStyleSpecifierMaximumLineHeight,
            .valueSize = sizeof(lineHeight),
            .value = &lineHeight,
        };
    }

    CTParagraphStyleRef paragraphStyle = CTParagraphStyleCreate(settings, settingCount);
    attrDict[(__bridge id)kCTParagraphStyleAttributeName] = (__bridge_transfer id)paragraphStyle;

    // Create attributed string
    CFAttributedStringRef attrString = CFAttributedStringCreate(
        kCFAllocatorDefault,
        (__bridge CFStringRef)text,
        (__bridge CFDictionaryRef)attrDict
    );

    // Create framesetter and frame
    CTFramesetterRef framesetter = CTFramesetterCreateWithAttributedString(attrString);

    CGMutablePathRef path = CGPathCreateMutable();
    // CoreText uses a flipped coordinate system; height is set to a large value
    CGPathAddRect(path, NULL, CGRectMake(0, 0, width, CGFLOAT_MAX));

    CTFrameRef frame = CTFramesetterCreateFrame(framesetter, CFRangeMake(0, 0), path, NULL);

    CFArrayRef ctLines = CTFrameGetLines(frame);
    CFIndex lineCount = CFArrayGetCount(ctLines);

    // Extract line strings
    NSMutableArray<NSString *> *lines = [NSMutableArray arrayWithCapacity:lineCount];
    for (CFIndex i = 0; i < lineCount; i++) {
        CTLineRef line = (CTLineRef)CFArrayGetValueAtIndex(ctLines, i);
        CFRange lineRange = CTLineGetStringRange(line);
        NSRange nsRange = NSMakeRange(lineRange.location, lineRange.length);

        // Clamp range to text length
        if (nsRange.location + nsRange.length > text.length) {
            nsRange.length = text.length - nsRange.location;
        }

        NSString *lineText = [text substringWithRange:nsRange];
        // Trim trailing newline
        if ([lineText hasSuffix:@"\n"]) {
            lineText = [lineText substringToIndex:lineText.length - 1];
        }
        [lines addObject:lineText];
    }

    // Handle empty text
    if (lines.count == 0) {
        [lines addObject:@""];
        lineCount = 1;
    }

    // Calculate height
    CGFloat totalHeight;
    if (lineHeight > 0) {
        totalHeight = lineCount * lineHeight;
    } else {
        // Use line origins to compute height
        if (lineCount > 0) {
            CGPoint *origins = malloc(sizeof(CGPoint) * lineCount);
            CTFrameGetLineOrigins(frame, CFRangeMake(0, 0), origins);

            CTLineRef lastLine = (CTLineRef)CFArrayGetValueAtIndex(ctLines, lineCount - 1);
            CGFloat ascent, descent, leading;
            CTLineGetTypographicBounds(lastLine, &ascent, &descent, &leading);

            // Origins are in flipped coordinates from bottom
            CGFloat firstOriginY = origins[0].y;
            CGFloat lastOriginY = origins[lineCount - 1].y;
            totalHeight = (firstOriginY - lastOriginY) + ascent + descent + leading;
            free(origins);
        } else {
            totalHeight = fontSize * 1.3;
        }
    }

    BOOL truncated = NO;
    NSInteger finalLineCount = lineCount;

    // Apply maxLines truncation
    if (maxLinesNum) {
        NSInteger maxLines = [maxLinesNum integerValue];
        if (maxLines > 0 && lineCount > maxLines) {
            lines = [[lines subarrayWithRange:NSMakeRange(0, maxLines)] mutableCopy];
            truncated = YES;
            finalLineCount = maxLines;

            if (lineHeight > 0) {
                totalHeight = maxLines * lineHeight;
            } else {
                // Recalculate based on truncated line count
                CGPoint *origins = malloc(sizeof(CGPoint) * lineCount);
                CTFrameGetLineOrigins(frame, CFRangeMake(0, 0), origins);

                CTLineRef truncLine = (CTLineRef)CFArrayGetValueAtIndex(ctLines, maxLines - 1);
                CGFloat ascent, descent, leading;
                CTLineGetTypographicBounds(truncLine, &ascent, &descent, &leading);

                CGFloat firstOriginY = origins[0].y;
                CGFloat truncOriginY = origins[maxLines - 1].y;
                totalHeight = (firstOriginY - truncOriginY) + ascent + descent + leading;
                free(origins);
            }
        }
    }

    totalHeight = ceil(totalHeight);

    NSDictionary *result = @{
        @"height": @(totalHeight),
        @"lineCount": @(finalLineCount),
        @"lines": lines,
        @"truncated": @(truncated),
    };

    // Cleanup
    CFRelease(frame);
    CGPathRelease(path);
    CFRelease(framesetter);
    CFRelease(attrString);

    return result;
}

#pragma mark - Module Implementation

@implementation PretextNative

RCT_EXPORT_MODULE()

#ifdef RCT_NEW_ARCH_ENABLED

- (NSDictionary *)measureTextSync:(NSDictionary *)input {
    return measureTextWithInput(input);
}

- (void)measureText:(NSDictionary *)input
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        @try {
            NSDictionary *result = measureTextWithInput(input);
            resolve(result);
        } @catch (NSException *exception) {
            reject(@"MEASURE_ERROR", exception.reason, nil);
        }
    });
}

- (void)measureTextBatch:(NSArray<NSDictionary *> *)inputs
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        @try {
            NSMutableArray *results = [NSMutableArray arrayWithCapacity:inputs.count];
            for (NSDictionary *input in inputs) {
                [results addObject:measureTextWithInput(input)];
            }
            resolve(results);
        } @catch (NSException *exception) {
            reject(@"BATCH_MEASURE_ERROR", exception.reason, nil);
        }
    });
}

- (NSDictionary *)getFontMetrics:(NSString *)fontFamily
                      fontWeight:(NSString *)fontWeight
                        fontSize:(double)fontSize {
    UIFont *font = getCachedFont(fontFamily, fontWeight, fontSize);
    return @{
        @"capHeight": @(font.capHeight),
        @"ascender": @(font.ascender),
        @"descender": @(font.descender),
        @"xHeight": @(font.xHeight),
        @"lineGap": @(font.leading),
        @"unitsPerEm": @(CTFontGetUnitsPerEm((__bridge CTFontRef)font)),
    };
}

- (void)clearCache {
    @synchronized(fontCache) {
        [fontCache removeAllObjects];
    }
}

- (NSDictionary *)getCacheStats {
    @synchronized(fontCache) {
        return @{
            @"fontMetricsEntries": @(fontCache.count),
            @"measurementEntries": @(0),
            @"hitRate": @(0),
        };
    }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativePretextNativeSpecJSI>(params);
}

#else

// Legacy bridge support

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(measureTextSync:(NSDictionary *)input) {
    return measureTextWithInput(input);
}

RCT_EXPORT_METHOD(measureText:(NSDictionary *)input
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        @try {
            NSDictionary *result = measureTextWithInput(input);
            resolve(result);
        } @catch (NSException *exception) {
            reject(@"MEASURE_ERROR", exception.reason, nil);
        }
    });
}

RCT_EXPORT_METHOD(measureTextBatch:(NSArray<NSDictionary *> *)inputs
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        @try {
            NSMutableArray *results = [NSMutableArray arrayWithCapacity:inputs.count];
            for (NSDictionary *input in inputs) {
                [results addObject:measureTextWithInput(input)];
            }
            resolve(results);
        } @catch (NSException *exception) {
            reject(@"BATCH_MEASURE_ERROR", exception.reason, nil);
        }
    });
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getFontMetrics:(NSString *)fontFamily
                                       fontWeight:(NSString *)fontWeight
                                       fontSize:(double)fontSize) {
    UIFont *font = getCachedFont(fontFamily, fontWeight, fontSize);
    return @{
        @"capHeight": @(font.capHeight),
        @"ascender": @(font.ascender),
        @"descender": @(font.descender),
        @"xHeight": @(font.xHeight),
        @"lineGap": @(font.leading),
        @"unitsPerEm": @(CTFontGetUnitsPerEm((__bridge CTFontRef)font)),
    };
}

RCT_EXPORT_METHOD(clearCache) {
    @synchronized(fontCache) {
        [fontCache removeAllObjects];
    }
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getCacheStats) {
    @synchronized(fontCache) {
        return @{
            @"fontMetricsEntries": @(fontCache.count),
            @"measurementEntries": @(0),
            @"hitRate": @(0),
        };
    }
}

#endif

@end
