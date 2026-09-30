// ============================================================================
//  MediSync — 3D printable enclosure (2x3 smart pill dispenser body)
//  Parametric OpenSCAD model. Render one part at a time with -D part="...":
//     part = "base"    | "hoppers" | "lid" | "tray" | "assembly"
//  Sized for a 220x220 (Ender 3) print bed. Units: millimetres.
// ============================================================================

part = "assembly";     // "body" | "base" | "hoppers" | "lid" | "tray" | "assembly"
$fn = 48;

// ---- Global grid -----------------------------------------------------------
COLS       = 3;
ROWS       = 2;
CELL       = 46;       // inner width/depth of one pill compartment
CELL_WALL  = 3;        // wall between/around compartments
WALL       = 2.4;      // general shell wall thickness
FLOOR      = 3;        // deck / floor thickness
FIT        = 0.35;     // clearance for mating parts

grid_w = COLS*CELL + (COLS+1)*CELL_WALL;   // 150
grid_d = ROWS*CELL + (ROWS+1)*CELL_WALL;   // 101

// ---- Heights ---------------------------------------------------------------
BASE_H     = 46;       // electronics base height
HOPPER_H   = 58;       // pill compartment tower height
FUNNEL_H   = 22;       // internal sloped funnel height
CHUTE_D    = 14;       // pill drop hole diameter
LIP_H      = 6;        // registration lip between base deck and hoppers
CORNER_R   = 5;        // outer corner radius

// ---- Component cutouts -----------------------------------------------------
// 16x2 I2C LCD module: PCB 80x36, viewing window ~66x16, mount holes 75x31
LCD_W = 66; LCD_H = 16; LCD_HOLE_DX = 75; LCD_HOLE_DY = 31;
// SG90 servo body pocket
SERVO_W = 23.2; SERVO_L = 12.6; SERVO_FLANGE = 5; SERVO_TAB_H = 2.6;
USB_W = 13; USB_H = 11;          // NodeMCU micro-USB slot
PWR_D = 9;                        // barrel/power grommet hole
VENT_D = 4;                       // ventilation hole diameter

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------
module rbox(w, d, h, r=CORNER_R) {          // rounded-corner box (vertical edges)
    hull() for (x=[r, w-r], y=[r, d-r]) translate([x,y,0]) cylinder(r=r, h=h);
}

module rbox_shell(w, d, h, wall, r=CORNER_R) {   // open-top rounded shell
    difference() {
        rbox(w, d, h, r);
        translate([wall, wall, FLOOR]) rbox(w-2*wall, d-2*wall, h, max(r-wall,0.6));
    }
}

// centre of compartment (col,row) in grid coords
function cell_cx(c) = CELL_WALL + CELL/2 + c*(CELL+CELL_WALL);
function cell_cy(r) = CELL_WALL + CELL/2 + r*(CELL+CELL_WALL);

// ---------------------------------------------------------------------------
//  BASE — electronics enclosure + top deck with 6 chutes, servo slots,
//         LCD window, ports, ventilation, and a front dispense opening.
// ---------------------------------------------------------------------------
module base() {
    difference() {
        union() {
            // outer shell (open bottom for wiring access; deck is the top)
            difference() {
                rbox(grid_w, grid_d, BASE_H);
                // hollow interior, leaving deck (FLOOR) at the very top
                translate([WALL, WALL, -0.1])
                    rbox(grid_w-2*WALL, grid_d-2*WALL, BASE_H-FLOOR+0.1, CORNER_R-WALL);
            }
            // registration lip on top deck to seat the hopper tower
            translate([0,0,BASE_H])
                difference() {
                    rbox(grid_w, grid_d, LIP_H);
                    translate([WALL+FIT, WALL+FIT, -0.1])
                        rbox(grid_w-2*(WALL+FIT), grid_d-2*(WALL+FIT), LIP_H+0.2, CORNER_R-WALL);
                }
        }

        // --- 6 pill drop chutes through the deck ---
        for (c=[0:COLS-1], r=[0:ROWS-1])
            translate([cell_cx(c), cell_cy(r), BASE_H-FLOOR-0.1])
                cylinder(d=CHUTE_D, h=FLOOR+LIP_H+0.2);

        // --- 6 servo pockets in the deck (beside each chute) ---
        for (c=[0:COLS-1], r=[0:ROWS-1])
            translate([cell_cx(c)+CHUTE_D/2+SERVO_L/2+1.5, cell_cy(r), BASE_H-FLOOR-0.1])
                servo_slot();

        // --- LCD window + mount holes on the front face (y=0) ---
        translate([grid_w/2, 0, BASE_H-FLOOR-6-LCD_H/2]) {
            translate([-LCD_W/2, -0.1, -LCD_H/2]) cube([LCD_W, WALL+0.2, LCD_H]);
            for (sx=[-1,1], sy=[-1,1])
                translate([sx*LCD_HOLE_DX/2, WALL/2, sy*LCD_HOLE_DY/2])
                    rotate([-90,0,0]) cylinder(d=3.2, h=WALL+2, center=true);
        }

        // --- NodeMCU USB slot (right side face, x=grid_w) ---
        translate([grid_w-WALL-0.1, grid_d*0.7, BASE_H/2])
            cube([WALL+0.2, USB_W, USB_H], center=false);

        // --- power grommet (left side face) ---
        translate([-0.1, grid_d*0.3, BASE_H/2]) rotate([0,90,0]) cylinder(d=PWR_D, h=WALL+0.2);

        // --- front dispense opening (pills exit to the tray) ---
        translate([grid_w/2-26, -0.1, FLOOR]) cube([52, WALL+0.2, 24]);

        // --- ventilation grid on the two long side walls ---
        for (side=[0,1], i=[0:5], j=[0:2])
            translate([side==0? -0.1 : grid_w-WALL-0.1,
                       25 + i*14, 10 + j*10])
                rotate([0,90,0]) cylinder(d=VENT_D, h=WALL+0.2);
    }
}

// SG90 pocket: body + flange ledge so the servo drops in from the top deck
module servo_slot() {
    // body through-hole
    translate([-SERVO_L/2, -SERVO_W/2, 0]) cube([SERVO_L, SERVO_W, FLOOR+2]);
    // flange ledge (wider, shallow) for the mounting tabs to rest on
    translate([-(SERVO_L+2*SERVO_FLANGE)/2, -SERVO_W/2, FLOOR-SERVO_TAB_H])
        cube([SERVO_L+2*SERVO_FLANGE, SERVO_W, SERVO_TAB_H+2]);
}

// ---------------------------------------------------------------------------
//  HOPPERS — the 2x3 tower of pill compartments with internal funnels.
// ---------------------------------------------------------------------------
module hoppers() {
    difference() {
        // solid outer block with rounded corners
        rbox(grid_w, grid_d, HOPPER_H);

        // hollow each compartment with a funnel floor over its chute
        for (c=[0:COLS-1], r=[0:ROWS-1]) {
            cx = cell_cx(c); cy = cell_cy(r);
            // upper straight cavity
            translate([cx-CELL/2, cy-CELL/2, FUNNEL_H])
                cube([CELL, CELL, HOPPER_H]);
            // sloped funnel: big square top -> small chute hole at bottom
            translate([cx, cy, -0.1])
                funnel(CELL, CHUTE_D+2, FUNNEL_H+0.1);
            // chute exit hole
            translate([cx, cy, -0.1]) cylinder(d=CHUTE_D+2, h=FLOOR+0.2);
        }
    }
    // register into the base lip
    translate([0,0,-LIP_H])
        difference() {
            rbox(grid_w-2*(WALL+FIT)-0.2, grid_d-2*(WALL+FIT)-0.2, LIP_H, CORNER_R-WALL);
            translate([WALL, WALL, -0.1])
                rbox(grid_w-2*(WALL+FIT)-0.2-2*WALL, grid_d-2*(WALL+FIT)-0.2-2*WALL, LIP_H+0.2, 1);
        }
}

// square-topped downward funnel (top size -> bottom size over height h)
module funnel(top, bot, h) {
    hull() {
        translate([0,0,h-0.01]) cube([top, top, 0.02], center=true);
        translate([0,0,0]) cylinder(d=bot, h=0.02);
    }
}

// ---------------------------------------------------------------------------
//  LID — single friction-fit lid covering all 6 compartments for filling.
// ---------------------------------------------------------------------------
module lid() {
    difference() {
        union() {
            rbox(grid_w, grid_d, WALL);                       // top plate
            // downward skirt that grips inside the hopper walls
            translate([0,0,-8])
                difference() {
                    rbox(grid_w-2*(WALL+FIT), grid_d-2*(WALL+FIT), 8, CORNER_R-WALL);
                    translate([WALL,WALL,-0.1])
                        rbox(grid_w-2*(WALL+FIT)-2*WALL, grid_d-2*(WALL+FIT)-2*WALL, 8.2, 1);
                }
        }
        // finger notch to lift the lid
        translate([grid_w/2, grid_d-8, -0.1]) cylinder(d=20, h=WALL+0.2);
    }
    // grip ribs
    for (c=[0:COLS-1]) translate([cell_cx(c), grid_d/2, WALL])
        cube([2, grid_d*0.6, 2], center=true);
}

// ---------------------------------------------------------------------------
//  TRAY — pull-out cup that catches dispensed pills at the front.
// ---------------------------------------------------------------------------
module tray() {
    tw = 60; td = 42; th = 22;
    difference() {
        rbox(tw, td, th, 4);
        translate([WALL, WALL, FLOOR]) rbox(tw-2*WALL, td-2*WALL, th, 3);
    }
    // front handle
    translate([tw/2, -0.1, th-6]) rotate([-90,0,0]) cylinder(d=10, h=6, $fn=6);
}

// ---------------------------------------------------------------------------
//  BODY — base + hopper tower fused into ONE monolithic print.
//  (Lid and tray stay separate: they are removable/moving parts.)
// ---------------------------------------------------------------------------
module body() {
    base();
    translate([0,0,BASE_H+LIP_H]) hoppers();
}

// ---------------------------------------------------------------------------
//  ASSEMBLY (preview only — not for printing)
// ---------------------------------------------------------------------------
module assembly() {
    color("SteelBlue")   base();
    color("Gainsboro")   translate([0,0,BASE_H+LIP_H]) hoppers();
    color("LightSlateGray") translate([0,0,BASE_H+LIP_H+HOPPER_H+3]) lid();
    color("Goldenrod")   translate([grid_w/2-30, -46, 0]) tray();
}

// ---- Dispatch --------------------------------------------------------------
if (part == "body")      body();
else if (part=="base")    base();
else if (part=="hoppers") hoppers();
else if (part=="lid")     lid();
else if (part=="tray")    tray();
else                      assembly();
