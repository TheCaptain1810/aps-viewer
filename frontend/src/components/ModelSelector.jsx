import { useEffect } from "react";
import PropTypes from "prop-types";

function ModelSelector({
  models,
  selectedModel,
  onModelSelect,
  onCheckStatus,
  modelStatus,
  isLoading,
}) {
  const handleModelChange = async (e) => {
    const urn = e.target.value;
    if (!urn) return;

    const model = models.find((m) => m.urn === urn);
    if (model) {
      onModelSelect(model);
      // Check status when model is selected
      await onCheckStatus(urn);
    }
  };

  // Check status periodically for models in progress
  useEffect(() => {
    if (modelStatus?.status === "inprogress" && selectedModel) {
      const timeout = setTimeout(() => {
        onCheckStatus(selectedModel.urn);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [modelStatus, selectedModel, onCheckStatus]);

  const getStatusMessage = () => {
    if (!modelStatus) return null;

    switch (modelStatus.status) {
      case "n/a":
        return "Model has not been translated.";
      case "inprogress":
        return `Model is being translated (${modelStatus.progress})...`;
      case "failed":
        return (
          <div>
            Translation failed:
            <ul>
              {modelStatus.messages?.map((msg, index) => (
                <li key={index}>{JSON.stringify(msg)}</li>
              ))}
            </ul>
          </div>
        );
      case "success":
        return "Model is ready for viewing.";
      default:
        return null;
    }
  };

  const getSelectText = () => {
    if (isLoading) return "Loading models...";
    if (models.length === 0) return "No models available";
    return "Select a model...";
  };

  return (
    <div className="model-selector">
      <select
        value={selectedModel?.urn || ""}
        onChange={handleModelChange}
        disabled={isLoading || models.length === 0}
        className="model-select"
        aria-label="Select model"
      >
        <option value="" disabled>
          {getSelectText()}
        </option>
        {models.map((model) => (
          <option key={model.urn} value={model.urn}>
            {model.name}
          </option>
        ))}
      </select>

      {modelStatus && (
        <div className={`status-message status-${modelStatus.status}`}>
          {getStatusMessage()}
        </div>
      )}
    </div>
  );
}

ModelSelector.propTypes = {
  models: PropTypes.arrayOf(
    PropTypes.shape({
      urn: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedModel: PropTypes.shape({
    urn: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  onModelSelect: PropTypes.func.isRequired,
  onCheckStatus: PropTypes.func.isRequired,
  modelStatus: PropTypes.object,
  isLoading: PropTypes.bool,
};

export default ModelSelector;
