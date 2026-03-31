#ifdef RCT_NEW_ARCH_ENABLED
#import <PretextNativeSpec/PretextNativeSpec.h>

@interface PretextNative : NSObject <NativePretextNativeSpec>
@end

#else
#import <React/RCTBridgeModule.h>

@interface PretextNative : NSObject <RCTBridgeModule>
@end

#endif
