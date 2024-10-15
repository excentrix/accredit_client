"use client";

import { MenuPanel } from "@/components/menuPanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Page() {
  // const { file } = useParams();
  const sp = useSearchParams();
  const file = sp.get("file");
  const [structure, setStructure] = useState<any>({});
  const [newField, setNewField] = useState({ name: "", type: "" });

  useEffect(() => {
    // Fetch the existing structure
    const fetchStructure = async () => {
      const response = await axios.get(`http://localhost:8000/naac/${file}`);
      setStructure(response.data.structure);
    };
    fetchStructure();
  }, [file]);

  const addField = () => {
    setStructure({
      ...structure,
      [newField.name]: newField.type,
    });
    setNewField({ name: "", type: "" });
    console.log(structure);
  };

  const deleteField = (fieldName: string) => {
    const updatedStructure = { ...structure };
    delete updatedStructure[fieldName];
    setStructure(updatedStructure);
  };

  const handleSave = async () => {
    // Send updated structure to backend
    try {
      await axios.post(`http://localhost:8000/naac/${file}/update_structure/`, {
        structure,
      });
      alert("Structure updated");
    } catch (error) {
      console.error("Error updating structure:", error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Data Management</h1>

      <div>
        {Object.keys(structure).map((key) => (
          <div key={key} className="mb-2 flex items-center">
            <label className="block font-semibold w-1/4">{key}:</label>
            <span className="text-gray-600 w-1/4">{structure[key]}</span>
            <button
              onClick={() => deleteField(key)}
              className="ml-4 bg-red-500 text-white p-1 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center">
        <input
          type="text"
          placeholder="Field Name"
          value={newField.name}
          onChange={(e) => setNewField({ ...newField, name: e.target.value })}
          className="mr-2 border p-1 w-1/4"
        />
        <select
          value={newField.type}
          onChange={(e) => setNewField({ ...newField, type: e.target.value })}
          className="mr-2 border p-1 w-1/4"
        >
          <option value="">Select Type</option>
          <option value="string">String</option>
          <option value="number">Number</option>
          <option value="boolean">Boolean</option>
        </select>
        <button
          onClick={addField}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Add Field
        </button>
      </div>

      <button
        onClick={handleSave}
        className="mt-4 bg-green-500 text-white p-2 rounded"
      >
        Save Changes
      </button>
    </div>
  );
}
