const Header = () => {
  return (
    <>
      <div id="header">
        <img
          className="logo"
          src="https://cdn.autodesk.io/logo/black/stacked.png"
          alt="Autodesk Platform Services"
        />
        <span className="title">Simple Viewer</span>
        <select name="models" id="models"></select>
        <button id="upload" title="Upload New Model">
          Upload
        </button>
        <input style={{ display: "none" }} type="file" id="input" />
      </div>
    </>
  );
};

export default Header;
