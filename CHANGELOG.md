# Changelog

## [1.3.0](https://github.com/spelech/ha-presence-detection-designer/compare/v1.2.3...v1.3.0) (2026-11-14)


### Features

* add negative-space spatial inference, timeline reconstruction, multi-sensor placement, and shade/sun exclusion ([#14](https://github.com/spelech/ha-presence-detection-designer/issues/14)) ([9b80ec1](https://github.com/spelech/ha-presence-detection-designer/commit/9b80ec1720fc9ca3ef8c4883a8b838f034f830d0))
* **bayesian:** enforce score/hold-only Bayesians, fix double-tempering, and confirm BLE penalties (BAYES-01..04) ([6469454](https://github.com/spelech/ha-presence-detection-designer/commit/6469454f448ea47a42791590c7748b10ae84bc78))
* **ble:** exclude BLE position as presence decider and isolate to continuous logging telemetry ([1004fa7](https://github.com/spelech/ha-presence-detection-designer/commit/1004fa74ec0f7a5a275b6572d0249cd6eeb3aa7c))
* **cooldown:** add signal retrigger cooldown, pinned occupant shielding, compact notifications, and remove Riley's food trigger from Dining Room ([5e6361f](https://github.com/spelech/ha-presence-detection-designer/commit/5e6361f8752f5a7ebc9976ff5a64813cd1b8617d))
* **floorplan:** lock down calibrated v4 3-floor layout, 4x blueprints, wall-clipped cones, and Tapo C110 model presets ([def9b89](https://github.com/spelech/ha-presence-detection-designer/commit/def9b89c84ee1e66a909fb4b905b974516500a69))
* **guest-room:** wire binary_sensor.guest_room_motion_occupancy into Guest Room Bayesian observations ([4b8505d](https://github.com/spelech/ha-presence-detection-designer/commit/4b8505d9f67978bfd737724be230374359e50cd6))
* **handoff:** implement staged accelerated adjacent handoff while preserving long stationary timeouts ([c3c276b](https://github.com/spelech/ha-presence-detection-designer/commit/c3c276bd9e385e352d3bbd2a009a1ca6dbcace29))
* **notifications:** implement daily self-updating Slack status board and transition threading architecture ([59d6d98](https://github.com/spelech/ha-presence-detection-designer/commit/59d6d985018212487ef7657273fa17a4641cb2fc))
* **perimeter:** implement house perimeter transition tracker, directional vectoring, and headcount engine ([c96968b](https://github.com/spelech/ha-presence-detection-designer/commit/c96968baacd1484fe789ceb2593903bd8e14fd85))
* **pir:** add PIRValidationStateMachine, cooldown weighting, and hardware re-inventory (PIR-01..03) ([6f44662](https://github.com/spelech/ha-presence-detection-designer/commit/6f44662f6a9df0c56685ee96501fd88a3c3d9c71))
* **release:** cut v0.2.0 with causal tracking, people/pet attribution, automation blueprints, and modular refactoring ([9215591](https://github.com/spelech/ha-presence-detection-designer/commit/9215591d270b3e0d29782b16ed54b7f081399b91))
* **sensors:** add IKEA VALLHORN dual-lobe PIR and Wyze Sense PIR/Contact hardware presets ([262941a](https://github.com/spelech/ha-presence-detection-designer/commit/262941a82c77ecbf2bbf015942dc24daa19fd884))
* **sensors:** set Ring Alarm Motion Detector preset to 90deg/30ft (475px) and keep single 1x instance ([e0009ad](https://github.com/spelech/ha-presence-detection-designer/commit/e0009ad68284f404d32da4db233f7a74abdc4d6c))
* **signals:** enforce person-coupled triggers, demote non-exclusive signals, and guard UPS holds by BLE (SIGNAL-01..03) ([d0cf59f](https://github.com/spelech/ha-presence-detection-designer/commit/d0cf59fe95d0f71ab5709853b1b9bf94a230cd0e))
* **stale-filter:** filter out stale retained MQTT messages and restored states ([99c7623](https://github.com/spelech/ha-presence-detection-designer/commit/99c7623f808b5e29b2bef4bf012e2edd8938fd09))
* **state-machine:** migrate occupancy lifecycle to hierarchical transitions engine ([5fc69eb](https://github.com/spelech/ha-presence-detection-designer/commit/5fc69ebd7859ff528aad93d774f900b67b67a044))
* **store:** auto-upgrade stored Wyze Sense PIR and Ring Contact sensor presets ([403d9fd](https://github.com/spelech/ha-presence-detection-designer/commit/403d9fdb8dedada9de3581131a611d6816a7539f))
* **topology:** add Garage Ring Alarm Gen 2 PIR (binary_sensor.ring_motion_sensor_55812) ([8a35b72](https://github.com/spelech/ha-presence-detection-designer/commit/8a35b72d3182b72b0d133e00b55dbb18b8d5bfb6))
* **topology:** add paired Guest Room IKEA VALLHORN PIR (binary_sensor.guest_room_motion_occupancy) ([e19959b](https://github.com/spelech/ha-presence-detection-designer/commit/e19959be0e13ff559ae3918b9e9248395799bcaa))
* **topology:** add topological path corroboration and candidate settling to wasp state transitions ([2a51e65](https://github.com/spelech/ha-presence-detection-designer/commit/2a51e6527dcdd51e516195c06c28f958a5e2def0))
* **topology:** aim 1x Ring PIR at basement stairs and calibrate table-height Ecobee sensors ([2f75302](https://github.com/spelech/ha-presence-detection-designer/commit/2f7530282c42d73bac65b2fb1ac67afd9293d244))
* **topology:** center 77A63DD9 above Master Bedroom door (360, 285) ([db7ef03](https://github.com/spelech/ha-presence-detection-designer/commit/db7ef03d14888b49eff396cf09696f81ba83457d))
* **topology:** pair & place 77A64D08 Wyze PIR in Kitchen stove alcove ([a874551](https://github.com/spelech/ha-presence-detection-designer/commit/a87455114bf3d2d6dcf94cf251220637084165d4))
* **topology:** pair & place 77A65433 Wyze PIR above Master Bathroom door ([028f07c](https://github.com/spelech/ha-presence-detection-designer/commit/028f07c9db3aec75e962d303a1045c33955f886c))
* **topology:** place 77916938 Wyze Sense PIR v1 in Laundry Room NE corner ([e9d909c](https://github.com/spelech/ha-presence-detection-designer/commit/e9d909cff2d10f992f22921058b6feae92bb6b45))
* **topology:** place 77A63DD9 & 77A64D3C Wyze PIRs in Upstairs Hallway & Stairwell ([c4f43da](https://github.com/spelech/ha-presence-detection-designer/commit/c4f43da22d77373bc61a0aff16fe3346115ecd9c))
* **topology:** recompile ray-traced cones in panel.js and bump version to 1.2.4 ([76f1a48](https://github.com/spelech/ha-presence-detection-designer/commit/76f1a48d542e974055c073bce01b730ebeb71024))
* **topology:** restore Family Room Ring Stick Up Cam (3rd Gen) aimed at Kitchen/Back Door ([164c68e](https://github.com/spelech/ha-presence-detection-designer/commit/164c68e65668234bf24f75b921bea03aee4f3696))
* **topology:** sync audited sensor entity IDs, storage room floor zone, and ConfigEntry options persistence ([aef7609](https://github.com/spelech/ha-presence-detection-designer/commit/aef7609b176a75fd6d2618e061230fb41d623b4d))
* **topology:** update Ring Keypad placements to Kitchen peninsula and Master bedside ([05d83fb](https://github.com/spelech/ha-presence-detection-designer/commit/05d83fb0f339e02030442640dbe0838db6a91d98))
* **topology:** update sensor entity IDs after Home Assistant registry cleanup ([b3cf58e](https://github.com/spelech/ha-presence-detection-designer/commit/b3cf58ee2903aa154fb81986936ae4a2ad0e54bb))
* **ui:** align Design Studio, previews, and blueprints with Phases 1-4 (UI-01..02) ([24e7463](https://github.com/spelech/ha-presence-detection-designer/commit/24e7463dd27cbc6cb40465f7e20f68cd1200f190))


### Bug Fixes

* **headcount:** constrain perimeter vectoring and reconcile stale counts ([#21](https://github.com/spelech/ha-presence-detection-designer/issues/21)) ([aef8e92](https://github.com/spelech/ha-presence-detection-designer/commit/aef8e92c554afb3c0b3e519ea2c69067765e839f))
* **lint:** format imports, code styles, and unused variables with ruff ([79af03c](https://github.com/spelech/ha-presence-detection-designer/commit/79af03c78625b7eca79b31e2adf713f3fc1cb41c))
* **notifications:** resolve Slack channel ID, share daily thread singleton across coordinators, and thread replies directly ([5d5432e](https://github.com/spelech/ha-presence-detection-designer/commit/5d5432e5f29419c0a614561cabb9396fa1f449ea))
* **presence:** prevent latching false positives by ticking clear rooms and enabling sealed bounded LLM verification ([42aa4a3](https://github.com/spelech/ha-presence-detection-designer/commit/42aa4a333c0ae9fac9645ca2e0fc883f9d773f30))
* **sensors:** remove decommissioned basement Wyze sensors and PARASOLL preset ([e08f069](https://github.com/spelech/ha-presence-detection-designer/commit/e08f06987c559f2ed43e1c7b5680c179873e545f))
* **slack:** live update daily card, fix room state detection, mute transition spam ([22cd707](https://github.com/spelech/ha-presence-detection-designer/commit/22cd7079aac4f9dfde826b2a2e28743238e1f52e))
* **store:** migrate Guest Room Ecobee sensor coordinates alongside VALLHORN PIR ([81b6052](https://github.com/spelech/ha-presence-detection-designer/commit/81b6052750dbe617754d66e9b8d0f9fb954f233c))
* **topology:** aim Main Floor Keypad East (410, 315 @ 0 deg) and remove unused ratgdo PIR ([80d794c](https://github.com/spelech/ha-presence-detection-designer/commit/80d794cf12f60de9b7f6b60734d3090437c7f8d8))
* **ui:** resolve responsive layout, Bayesian table min-widths, and floorplan SVG label collisions ([5e6fc31](https://github.com/spelech/ha-presence-detection-designer/commit/5e6fc31b3286b7e9c7521ceda0ce8e64735c5ff2))


### Performance Improvements

* **topology:** precompute and cache room adjacency graph and multi-hop paths once ([59d3374](https://github.com/spelech/ha-presence-detection-designer/commit/59d33745fb56c3587d8db0b8dea39f95d3535b55))


### Documentation

* add custom 1280x640 social preview card (.github/social-preview.svg) ([c41c825](https://github.com/spelech/ha-presence-detection-designer/commit/c41c825fcd5b9f0d9a9d98a11150e19bd1f9dc2b))
* fix logo path, add HACS/Hassfest badge and 1-click Open in HACS button ([1d76a53](https://github.com/spelech/ha-presence-detection-designer/commit/1d76a53e6cb39fbb2ee371fa3859decad163242f))
* **spec:** lock STATE-07, GUARD-06..07, and REPLAY-02 with regression tests ([59ae3d3](https://github.com/spelech/ha-presence-detection-designer/commit/59ae3d3527d6aa0b19c40f9ab9a953af09c9fa4f))
* **srs:** lock in REQUIREMENTS.md, ARCHITECTURE.md, and transitions baseline ([36e82f0](https://github.com/spelech/ha-presence-detection-designer/commit/36e82f0ea572439fbfdc63e3e0cde05bac1a7e1b))
