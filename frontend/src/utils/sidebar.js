import InspireTree from "inspire-tree";
import InspireTreeDOM from "inspire-tree-dom";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "";

async function getJSON(url) {
  const resp = await fetch(url, {
    credentials: "include", // Include cookies for session
  });
  if (!resp.ok) {
    alert("Could not load tree data. See console for more details.");
    console.error(await resp.text());
    return [];
  }
  return resp.json();
}

function createTreeNode(id, text, icon, children = false) {
  return { id, text, children, itree: { icon } };
}

async function getHubs() {
  const hubs = await getJSON(`${SERVER_URL}/api/hubs`);
  return hubs.map((hub) =>
    createTreeNode(`hub|${hub.id}`, hub.name, "icon-hub", true)
  );
}

async function getProjects(hubId) {
  const projects = await getJSON(`${SERVER_URL}/api/hubs/${hubId}/projects`);
  return projects.map((project) =>
    createTreeNode(
      `project|${hubId}|${project.id}`,
      project.name,
      "icon-project",
      true
    )
  );
}

async function getContents(hubId, projectId, folderId = null) {
  const contents = await getJSON(
    `${SERVER_URL}/api/hubs/${hubId}/projects/${projectId}/contents` +
      (folderId ? `?folder_id=${folderId}` : "")
  );
  return contents.map((item) => {
    if (item.folder) {
      return createTreeNode(
        `folder|${hubId}|${projectId}|${item.id}`,
        item.name,
        "icon-my-folder",
        true
      );
    } else {
      return createTreeNode(
        `item|${hubId}|${projectId}|${item.id}`,
        item.name,
        "icon-item",
        true
      );
    }
  });
}

async function getVersions(hubId, projectId, itemId) {
  const versions = await getJSON(
    `${SERVER_URL}/api/hubs/${hubId}/projects/${projectId}/contents/${itemId}/versions`
  );
  return versions.map((version) =>
    createTreeNode(
      `version|${version.urn}|${version.id}`, // Store both URN and ID
      version.name,
      "icon-version"
    )
  );
}

export function initTree(targetElement, onSelectionChanged) {
  const tree = new InspireTree({
    data: function (node) {
      if (!node || !node.id) {
        return getHubs();
      } else {
        const tokens = node.id.split("|");
        switch (tokens[0]) {
          case "hub":
            return getProjects(tokens[1]);
          case "project":
            return getContents(tokens[1], tokens[2]);
          case "folder":
            return getContents(tokens[1], tokens[2], tokens[3]);
          case "item":
            return getVersions(tokens[1], tokens[2], tokens[3]);
          default:
            return [];
        }
      }
    },
  });

  tree.on("node.click", function (event, node) {
    event.preventTreeDefault();
    const tokens = node.id.split("|");
    console.log("Node clicked:", node.id, "Tokens:", tokens);
    if (tokens[0] === "version") {
      console.log("Version selected, URN:", tokens[1]);
      onSelectionChanged(tokens[1]); // Use the URN directly
    }
  });

  // Accept either a string selector or DOM element
  const target =
    typeof targetElement === "string" ? targetElement : targetElement;
  return new InspireTreeDOM(tree, { target });
}
