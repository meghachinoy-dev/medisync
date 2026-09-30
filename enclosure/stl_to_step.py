#!/usr/bin/env python3
"""Convert the MediSync enclosure STL meshes to STEP (tessellated BREP).

Note: STL is a triangle mesh and STEP is a solid CAD format, so each mesh
triangle becomes a planar face. The result is a valid STEP solid that any
CAD tool can open, but it is faceted, not smooth parametric geometry.
"""
import os
from OCP.StlAPI import StlAPI_Reader
from OCP.TopoDS import TopoDS_Shape
from OCP.STEPControl import STEPControl_Writer, STEPControl_AsIs
from OCP.IFSelect import IFSelect_RetDone
from OCP.Interface import Interface_Static

HERE = os.path.dirname(os.path.abspath(__file__))
STL_DIR = os.path.join(HERE, "stl")
STEP_DIR = os.path.join(HERE, "step")
os.makedirs(STEP_DIR, exist_ok=True)

Interface_Static.SetCVal_s("write.step.unit", "MM")

parts = ["medisync_body", "medisync_lid", "medisync_tray"]
for name in parts:
    stl_path = os.path.join(STL_DIR, name + ".stl")
    step_path = os.path.join(STEP_DIR, name + ".step")

    shape = TopoDS_Shape()
    reader = StlAPI_Reader()
    if not reader.Read(shape, stl_path):
        print(f"FAILED to read {stl_path}")
        continue

    writer = STEPControl_Writer()
    writer.Transfer(shape, STEPControl_AsIs)
    status = writer.Write(step_path)
    ok = status == IFSelect_RetDone
    size = os.path.getsize(step_path) if ok else 0
    print(f"{'OK ' if ok else 'ERR'} {name}.step  ({size/1024:.0f} KB)")

print("Done -> " + STEP_DIR)
