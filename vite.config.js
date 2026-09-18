import { defineConfig } from "vite";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

// ⚠ `data/` va `bg/` duoc FETCH luc chay, khong duoc import, nen Vite khong thay chung. Khong
// chep sang dist thi trang build ra van len hinh roi chet ngay o loadData - kieu hong im lang
// te nhat: bam Play khong co gi xay ra.
function copyRuntimeFiles() {
  return {
    name: "copy-runtime-files",
    closeBundle() {
      for (const dir of ["data", "bg"]) {
        const from = root + dir, to = root + "dist/" + dir;
        if (!existsSync(from)) continue;
        mkdirSync(to, { recursive: true });
        for (const f of readdirSync(from)) copyFileSync(from + "/" + f, to + "/" + f);
      }
    },
  };
}

// Duong ghi cua `editor.html`. Trinh duyet khong ghi duoc file, nen editor POST sang day va may
// chu DEV ghi vao `data/`.
//
// ⚠ `configureServer` nen no CHI ton tai khi `npm run dev`. Khong co gi trong ban build mo mot
// duong ghi file - do la thu duy nhat khien mot cong cu noi bo tro thanh mot lo hong.
//
// ⚠ NHAN BAN KHI DUNG CHUNG: nhieu level co the tro vao cung mot carrier/spline, nen sua thang
// la sua luon cac level khac - hong theo kieu chi thay o mot man hinh khac, nhieu ngay sau.
function editorSave() {
  const dir = root + "data/";
  const rd = (f) => JSON.parse(readFileSync(dir + f, "utf8"));
  const wr = (f, v) => writeFileSync(dir + f, JSON.stringify(v));
  return {
    name: "loopsort-editor-save",
    configureServer(server) {
      server.middlewares.use("/__loopsort/save", (req, res, next) => {
        if (req.method !== "POST") return next();
        let raw = "";
        req.on("data", (c) => { raw += c; if (raw.length > 1e6) req.destroy(); });
        req.on("end", () => {
          res.setHeader("content-type", "application/json");
          try {
            const b = JSON.parse(raw);
            const id = Number(b.id);
            if (!Number.isInteger(id) || id < 1) throw new Error("id khong hop le");
            if (typeof b.spline !== "string" || typeof b.colorData !== "string")
              throw new Error("thieu spline/colorData");
            if (!existsSync(dir + "Levels.json")) throw new Error("chua co data/");

            const levels = rd("Levels.json"), carriers = rd("Carriers.json"), splines = rd("Splines.json");
            let lv = levels.find((x) => x.Id === id);
            if (!lv) {
              lv = { Map: 0, Carriers: 0, Spline: 0, Theme: "Default", SlotCount: 8, CameraRotation: 0, ColorMix: 0, Id: id };
              levels.push(lv);
              levels.sort((a, z) => a.Id - z.Id);
            }
            const shared = (key) => levels.filter((x) => x[key] === lv[key]).length > 1 || !lv[key];
            const next1 = (arr) => arr.reduce((m, x) => Math.max(m, x.Id), 0) + 1;

            let cloned = false;
            let car = carriers.find((x) => x.Id === lv.Carriers);
            if (!car || shared("Carriers")) {
              car = { ColorData: "", Features: "-", Colors: null, Id: next1(carriers) };
              carriers.push(car); lv.Carriers = car.Id; cloned = true;
            }
            car.ColorData = b.colorData;

            let sp = splines.find((x) => x.Id === lv.Spline);
            if (!sp || shared("Spline")) {
              sp = { Spline: "", Closed: true, Id: next1(splines) };
              splines.push(sp); lv.Spline = sp.Id; cloned = true;
            }
            sp.Spline = b.spline;
            if (typeof b.closed === "boolean") sp.Closed = b.closed;
            if (Number.isInteger(b.slotCount)) lv.SlotCount = b.slotCount;

            wr("Levels.json", levels); wr("Carriers.json", carriers); wr("Splines.json", splines);
            res.end(JSON.stringify({ ok: true, cloned, carrier: lv.Carriers, spline: lv.Spline }));
          } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false, error: String(e.message || e) }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  // ⚠ Duong dan TUONG DOI: trang chay o https://<user>.github.io/Loopsort/, khong phai o goc ten
  // mien, nen moi duong dan tuyet doi se 404.
  base: "./",
  plugins: [copyRuntimeFiles(), editorSave()],
  build: {
    // ⚠ es2022: editor.js dung top-level await, esbuild tu choi no o es2020. Moi trinh duyet
    // con cap nhat deu chay duoc (Safari 15+, Chrome 89+).
    target: "es2022",
    rollupOptions: {
      input: { index: root + "index.html", editor: root + "editor.html" },
    },
  },
});
