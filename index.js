const express = require("express")
const simpleGit = require("simple-git")
const app = express()
const port = process.env.PORT || 3000

app.get("/check-git-tree", async (req, res) => {
  const { repoUrl, path } = req.query
  if (!repoUrl || !path) {
    return res
      .status(400)
      .json({ error: "Missing repoUrl or path query parameter" })
  }

  try {
    const git = simpleGit()
    const localPath = "./temp-repo"

    // Clone the repo
    await git.clone(repoUrl, localPath)

    // Get the tree structure
    const tree = await git.cwd(localPath).raw(["ls-tree", "-r", "HEAD", path])

    // Clean up
    await git.cwd(localPath).clean("f", ["-d"])

    res.json({ tree })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
