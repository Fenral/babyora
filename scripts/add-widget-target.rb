#!/usr/bin/env ruby
# frozen_string_literal: true

# P9.2.0 (2026-06-13): Idempotent script som legger til Widget extension-
# target i ios/App/App.xcodeproj.
#
# Kjøres lokalt på Mac eller som pre-build-steg i Codemagic.
#
# Krav:
#   gem install xcodeproj
#   Apple-portal: App Group `group.no.klemeg.app` registrert
#   Apple-portal: Identifier `no.klemeg.app.widget` registrert med App Group-capability
#
# Bruk:
#   ruby scripts/add-widget-target.rb
#
# Idempotent: hvis target finnes, oppdaterer kun manglende build-settings.

require 'xcodeproj'

PROJECT_PATH = 'ios/App/App.xcodeproj'
WIDGET_TARGET_NAME = 'BabyoraWidget'
WIDGET_BUNDLE_ID = 'no.klemeg.app.widget'
APP_GROUP_ID = 'group.no.klemeg.app'
TEAM_ID = 'PL9G26C26C'
DEPLOYMENT_TARGET = '16.0'
WIDGET_SOURCES_DIR = 'ios/App/BabyoraWidget'

unless File.exist?(PROJECT_PATH)
  warn "FEIL: #{PROJECT_PATH} finnes ikke. Kjør fra repo-rot."
  exit 1
end

project = Xcodeproj::Project.open(PROJECT_PATH)

# 1. Finn eller opprett widget-target
existing = project.targets.find { |t| t.name == WIDGET_TARGET_NAME }

if existing
  puts "Target #{WIDGET_TARGET_NAME} finnes allerede — oppdaterer build-settings."
  widget_target = existing
else
  puts "Oppretter nytt target #{WIDGET_TARGET_NAME}."
  widget_target = project.new_target(
    :app_extension,
    WIDGET_TARGET_NAME,
    :ios,
    DEPLOYMENT_TARGET
  )
end

# 2. Build-settings
widget_target.build_configurations.each do |config|
  s = config.build_settings
  s['PRODUCT_BUNDLE_IDENTIFIER'] = WIDGET_BUNDLE_ID
  s['DEVELOPMENT_TEAM'] = TEAM_ID
  s['INFOPLIST_FILE'] = 'BabyoraWidget/Info.plist'
  s['CODE_SIGN_STYLE'] = 'Manual'
  s['CODE_SIGN_IDENTITY'] = 'Apple Distribution'
  s['SWIFT_VERSION'] = '5.0'
  s['IPHONEOS_DEPLOYMENT_TARGET'] = DEPLOYMENT_TARGET
  s['TARGETED_DEVICE_FAMILY'] = '1,2'
  s['SKIP_INSTALL'] = 'YES'
  s['ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES'] = 'NO'
  s['CODE_SIGN_ENTITLEMENTS'] = 'BabyoraWidget/BabyoraWidget.entitlements'
  s['CURRENT_PROJECT_VERSION'] = '1'
  s['MARKETING_VERSION'] = '1.0.1'
end

# 3. Source-filer (idempotent — finner eller oppretter)
widget_group = project.main_group.find_subpath(WIDGET_TARGET_NAME, true)
widget_group.set_source_tree('SOURCE_ROOT')

%w[BabyoraWidget.swift BabyoraWidgetBundle.swift WidgetSnapshot.swift].each do |file|
  path = "#{WIDGET_SOURCES_DIR}/#{file}"
  ref = widget_group.files.find { |f| f.path == file } ||
        widget_group.new_reference(file)
  ref.last_known_file_type = 'sourcecode.swift'
  unless widget_target.source_build_phase.files_references.include?(ref)
    widget_target.add_file_references([ref])
  end
end

# 4. App-target trenger App Group-entitlement også
app_target = project.targets.find { |t| t.name == 'App' }
if app_target
  app_target.build_configurations.each do |config|
    config.build_settings['CODE_SIGN_ENTITLEMENTS'] ||= 'App/App.entitlements'
  end
end

# 5. Embed widget i app
embed_phase = app_target.copy_files_build_phases.find do |p|
  p.symbol_dst_subfolder_spec == :plug_ins
end
embed_phase ||= app_target.new_copy_files_build_phase('Embed App Extensions').tap do |p|
  p.symbol_dst_subfolder_spec = :plug_ins
  p.dst_path = ''
  app_target.build_phases.unshift(p) # Først i kjeden
end

widget_product = widget_target.product_reference
unless embed_phase.files.any? { |f| f.file_ref == widget_product }
  embed_phase.add_file_reference(widget_product).tap do |bf|
    bf.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
  end
end

# 6. App depends on widget
unless app_target.dependencies.any? { |d| d.target == widget_target }
  app_target.add_dependency(widget_target)
end

project.save
puts "✓ #{WIDGET_TARGET_NAME} oppdatert."
puts "  Bundle ID: #{WIDGET_BUNDLE_ID}"
puts "  App Group: #{APP_GROUP_ID}"
puts "  Team ID:   #{TEAM_ID}"
puts ''
puts 'Husk:'
puts "  1. Apple-portal: App Group #{APP_GROUP_ID} registrert ✓"
puts "  2. Apple-portal: Identifier #{WIDGET_BUNDLE_ID} med App Group ✓"
puts '  3. Entitlements-filer på plass (auto-opprettes av neste runde):'
puts "       ios/App/App/App.entitlements"
puts "       ios/App/#{WIDGET_TARGET_NAME}/#{WIDGET_TARGET_NAME}.entitlements"
