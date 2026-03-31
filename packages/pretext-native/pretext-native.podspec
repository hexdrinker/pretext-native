require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "pretext-native"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/hexdrinker/pretext-native"
  s.license      = package["license"]
  s.authors      = { "hexdrinker" => "hexdrinker@github.com" }
  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/hexdrinker/pretext-native.git", :tag => s.version.to_s }

  s.source_files = "ios/**/*.{h,m,mm,cpp,swift}"
  s.frameworks   = "CoreText", "UIKit"

  if defined?(install_modules_dependencies)
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"

    if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
      s.compiler_flags = '-DRCT_NEW_ARCH_ENABLED'
      s.pod_target_xcconfig = {
        "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/Headers/Private/React-Codegen/react/renderer/components\"",
        "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
      }
    end
  end
end
