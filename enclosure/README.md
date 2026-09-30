# MediSync — 3D Printed Enclosure

The dispenser **body**: a 2×3 pill-compartment tower on an electronics base, with a
fill lid and a pull-out collection tray. Parametric OpenSCAD model → printable STLs.
Designed to fit a **220 × 220 mm (Ender 3)** bed.

## Files
- `medisync_enclosure.scad` — the parametric source (edit dimensions at the top)
- `stl/` — ready-to-slice parts: `base`, `hoppers`, `lid`, `tray`
- `preview/` — rendered images

## Parts & print settings — 3 prints

The dispenser is **3 prints**: one monolithic body plus two small removable parts. The
lid and tray can't be fused into the body — you lift the lid to fill compartments and
pull the tray out to collect pills.

| Part | Footprint | Qty | Orientation | Supports |
|---|---|---|---|---|
| `medisync_body.stl` | 150 × 101 × 110 mm | 1 | open bottom on the bed | **yes — internal** (see note) |
| `medisync_lid.stl` | ~144 × 95 × 10 mm | 1 | skirt down | none |
| `medisync_tray.stl` | 60 × 42 × 22 mm | 1 | as-is | none |

> **Support note:** the fused body puts the electronics deck (the floor the hoppers sit
> on) as an internal ceiling over the hollow electronics cavity — a ~140 mm span that's
> too wide to bridge, so the slicer needs **support inside the cavity**, removed afterward
> through the open bottom. Enable supports "everywhere" (or "inside only") when slicing
> `medisync_body.stl`. The lid and tray need none.
>
> _Support-free alternative:_ if you'd rather avoid internal supports, re-export the body
> as two halves that split on that deck — `-D 'part="base"'` and `-D 'part="hoppers"'`
> (see the commands below). That makes it 4 support-free prints instead of 3.

**Recommended slicer settings**
- Material: **PLA or PETG**
- Layer height: **0.2 mm**
- Walls: **3 perimeters**; Infill: **20 %**
- No supports needed if oriented as above (funnel slopes are ~45°).
- Print the base first — it's the longest job (~1.6 MB mesh, most geometry).

## Assembled dimensions
- Footprint **150 × 101 mm**, total height **≈ 113 mm** (base 46 + lip 6 + hoppers 58 + lid 3).

## Component fit (cutouts already in the base)
- **16×2 I²C LCD** — front window 66 × 16 mm + 4 × M3 holes at 75 × 31 mm.
- **6 × SG90 servos** — drop-in deck pockets beside each pill chute (flange ledge).
- **NodeMCU** — micro-USB slot on the right wall.
- **Power** — 9 mm grommet hole on the left wall.
- **Ventilation** — hole grid on both long walls.
- **Dispense** — 52 × 24 mm front opening feeds the pull-out tray.
- **6 pill chutes** — 14 mm drop holes align hopper funnels to the servo gates.

## Assembly order
1. Mount the 6 servos into the base deck pockets; route wiring inside the base.
2. Fit the LCD to the front window (M3 screws), NodeMCU by the USB slot, power to the grommet.
3. Seat the **hoppers** tower onto the base — the skirt registers into the deck lip.
4. Fill compartments from the top; press on the **lid** (friction skirt).
5. Slide the **tray** into the front opening to catch dispensed pills.

## Re-rendering / customizing
Edit parameters at the top of the `.scad` (grid size, wall thickness, heights,
component cutouts), then re-export any part:

```bash
# preview image
xvfb-run -a ~/Applications/OpenSCAD.AppImage -o preview/assembly.png \
  --imgsize=900,700 --camera=75,50,60,60,0,25,600 medisync_enclosure.scad

# export one printable part (base | hoppers | lid | tray)
xvfb-run -a ~/Applications/OpenSCAD.AppImage -o stl/medisync_base.stl \
  -D 'part="base"' medisync_enclosure.scad
```

> This is a functional **v1 body**. Before printing the final version, verify the
> SG90 pocket and LCD window against your exact modules — cheap parts vary a
> millimetre or two, and the `.scad` parameters make those easy to adjust.
