const express = require("express")
const axios = require("axios")
const app = express()
const port = process.env.PORT || 3000

app.get("/check-git-tree", async (req, res) => {
  const { owner, repo, path, ref = "main" } = req.query

  if (!owner || !repo || !path) {
    return res
      .status(400)
      .json({ error: "Missing owner, repo, or path query parameter" })
  }

  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`
    const { data } = await axios.get(apiUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        // Include your GitHub token for higher rate limits if needed
        // 'Authorization': `token YOUR_GITHUB_TOKEN`
      },
    })

    const tree = data.tree.filter((item) =>
      item.path.startsWith(path.replace(/^\//, ""))
    )

    // Generate a text representation of the tree with download URLs
    let treeText = ""
    tree.forEach((item) => {
      const itemType = item.type === "tree" ? "DIR" : "FILE"
      const fileUrl =
        itemType === "FILE"
          ? `/get-file-content?owner=${owner}&repo=${repo}&path=${item.path}&ref=${ref}`
          : ""
      treeText += `${itemType}: ${item.path} ${fileUrl}\n`
    })

    res.setHeader("Content-Type", "text/plain")
    res.send(treeText)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get("/get-file-content", async (req, res) => {
  const { owner, repo, path, ref = "main" } = req.query

  if (!owner || !repo || !path) {
    return res
      .status(400)
      .json({ error: "Missing owner, repo, or path query parameter" })
  }

  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path.replace(
      /^\//,
      ""
    )}?ref=${ref}`
    const { data } = await axios.get(apiUrl, {
      headers: {
        Accept: "application/vnd.github.v3.raw",
        // Include your GitHub token for higher rate limits if needed
        // 'Authorization': `token YOUR_GITHUB_TOKEN`
      },
    })

    res.setHeader("Content-Type", "text/plain")
    res.send(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
