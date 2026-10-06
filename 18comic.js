class ComicSource18Comic extends ComicSource {
    name = "18Comic"
    key = "18comic.vip"
    version = "1.0.2"
    minAppVersion = "1.16.0"
    url = "https://raw.githubusercontent.com/Tobeinlovewith/veneranext-source/main/18comic.js"

    baseUrl = "https://18comic.vip"

    init() {}

    async get(url) {
        let r = await Network.get(url, {
            "User-Agent": "Mozilla/5.0",
            "Referer": this.baseUrl + "/"
        })
        if (r.status != 200) throw "HTTP " + r.status
        return new HtmlDocument(r.body)
    }

    full(url) {
        if (!url) return ""
        if (url.startsWith("http")) return url
        if (url.startsWith("//")) return "https:" + url
        if (url.startsWith("/")) return this.baseUrl + url
        return this.baseUrl + "/" + url
    }

    id(url) {
        let m = (url || "").match(/\/(?:album|photo)\/(\d+)/)
        return m ? m[1] : ""
    }

    img(e) {
        if (!e) return ""
        let a = e.attributes
        return this.full(
            a["data-src"] ||
            a["data-original"] ||
            a["data-lazy-src"] ||
            a["src"] ||
            ""
        )
    }

    search = {
        load: async (keyword, options, page) => {
            let url = this.baseUrl +
                "/search/photos?main_tag=0&search_query=" +
                encodeURIComponent(keyword) +
                "&search-type=photos&page=" + page

            let d = await this.get(url)
            let result = []

            for (let a of d.querySelectorAll("a")) {
                let href = a.attributes["href"] || ""

                if (href.indexOf("/album/") < 0) continue

                let id = this.id(href)
                if (!id) continue

                let title = a.text.trim()
                if (!title) title = "Album " + id

                let image = a.querySelector("img")

                result.push({
                    id: id,
                    title: title,
                    cover: this.img(image),
                    tags: [],
                    description: ""
                })
            }

            return {
                comics: result,
                maxPage: result.length == 0 ? page : null
            }
        },

        optionList: []
    }

    comic = {
        loadInfo: async (id) => {
            let d = await this.get(
                this.baseUrl + "/album/" + id + "/"
            )

            let h = d.querySelector("h1")
            let title = h ? h.text.trim() : "Album " + id

            let cover = ""
            let image = d.querySelector("img")
            if (image) cover = this.img(image)

            let chapters = new Map()
            let n = 1

            for (let a of d.querySelectorAll("a")) {
                let href = a.attributes["href"] || ""

                if (href.indexOf("/photo/") < 0) continue

                let ep = this.id(href)
                if (!ep) continue

                let name = a.text.trim()
                if (!name) name = "Chapter " + n

                chapters.set(ep, name)
                n++
            }

            return {
                title: title,
                cover: cover,
                description: "",
                tags: {},
                chapters: chapters
            }
        },

        loadEp: async (comicId, epId) => {
            let d = await this.get(
                this.baseUrl +
                "/photo/" +
                epId +
                "/?read_mode=read-by-page"
            )

            let images = []

            for (let e of d.querySelectorAll("img")) {
                let url = this.img(e)

                if (url && !images.includes(url)) {
                    images.push(url)
                }
            }

            return {
                images: images
            }
        }
    }

    comicDetails = {
        loadInfo: async (id) => {
            return await this.comic.loadInfo(id)
        }
    }
}

ComicSource.sources["18comic.vip"] =
    new ComicSource18Comic()
