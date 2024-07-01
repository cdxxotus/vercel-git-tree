const express = require("express")
const axios = require("axios")
const app = express()
const port = process.env.PORT || 3000

app.get("/check-git-tree", async (req, res) => {
  const { owner, repo, path = "", ref = "main" } = req.query

  if (!owner || !repo) {
    return res
      .status(400)
      .json({ error: "Missing owner or repo query parameter" })
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

    // Generate a simple HTML representation of the tree with links
    let treeHtml = `<html><body><h1>Git Tree for ${owner}/${repo}</h1><ul>`
    tree.forEach((item) => {
      if (item.type === "tree") {
        treeHtml += `<li><a href="/check-git-tree?owner=${owner}&repo=${repo}&path=${item.path}&ref=${ref}">${item.path}/</a></li>`
      } else if (item.type === "blob") {
        const fileUrl = `/get-file-content?owner=${owner}&repo=${repo}&path=${item.path}&ref=${ref}`
        const filename = item.path.split("/").pop()
        treeHtml += `<li><a href="${fileUrl}">${filename}</a></li>`
      }
    })
    treeHtml += `</ul></body></html>`

    res.setHeader("Content-Type", "text/html")
    res.send(treeHtml)
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

    const fileContent = `
      <html>
      <body>
        <h1>Content of ${path}</h1>
        <pre>${data}</pre>
        <a href="/check-git-tree?owner=${owner}&repo=${repo}&path=${path.substring(
      0,
      path.lastIndexOf("/")
    )}&ref=${ref}">Back</a>
      </body>
      </html>
    `

    res.setHeader("Content-Type", "text/html")
    res.send(fileContent)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
