import { useState, useEffect } from "react";

const ModelSelector = ({ viewer, selectedUrn, onModelSelected }) => {
  const [models, setModels] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const resp = await fetch("/api/models");
        if (!resp.ok) {
          throw new Error(await resp.text());
        }
        const data = await resp.json();
        setModels(data);
      } catch (err) {
        setError("Could not list models. See the console for more details.");
        console.error(err);
      }
    };
    fetchModels();
  }, []);

  useEffect(() => {
    if (selectedUrn && models.length > 0) {
      onModelSelected(viewer, selectedUrn);
    }
  }, [models, selectedUrn, viewer, onModelSelected]);

  const handleChange = (event) => {
    onModelSelected(viewer, event.target.value);
  };

  return (
    <div className="w-full max-w-xs mx-auto">
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          {error}
        </div>
      )}
      <select
        id="models"
        className="block w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        onChange={handleChange}
        value={selectedUrn || ""}
      >
        <option value="" disabled>
          Select a model
        </option>
        {models.map((model) => (
          <option key={model.urn} value={model.urn}>
            {model.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModelSelector;
