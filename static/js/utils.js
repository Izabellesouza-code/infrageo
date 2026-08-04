/* global L */
export function registerUtils(app) {

  app.normalizeFeatureLabel = function normalizeFeatureLabel(key) {
      const raw = String(key || "").trim();
      const aliases = {
        unidade_fe: "Unidade FE",
        codigo_br: "Código BR",
        codigo_snv: "Código SNV",
        contratada: "Contratada",
        contrato: "Contrato",
        contratos: "Contratos",
        km_inicial: "Km inicial",
        km_final: "Km final",
        nm_municipio: "Município",
        municipio: "Município",
        vl_codigo: "Código",
        terrai_nom: "Terra indígena",
        etnia_nome: "Etnia",
        nome: "Nome",
        lote: "Lote",
        operacao: "Operação",
        supervisao: "Supervisão",
        proc_dnit: "Proc. DNIT",
        proc_ipaam: "Proc. IPAAM",
        area_ha: "Área (ha)",
        area_km2: "Área (km²)",
        extensao_k: "Extensão (km)",
        regiao_hid: "Região hidrográfica",
        sequencia: "Sequência",
        codigo: "Código",
        trecho: "Trecho",
        observacao: "Observação",
        condicao: "Condição",
        dimensao: "Dimensão",
        largura: "Largura",
        br_uf: "BR/UF",
        atividade: "Atividade",
        descricao: "Descrição",
        descriptio: "Descrição",
        modalidade: "Modalidade",
        fase_ti: "Fase da TI",
        uf_sigla: "UF",
      };
      const k = raw
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      if (aliases[k]) return aliases[k];
      return app.normalizePtBrText(raw)
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

  app.normalizePtBrText = function normalizePtBrText(input) {
      const s = String(input ?? "");
      // Corrige "mojibake" (UTF-8 interpretado como Latin-1/CP1252) quando aparecer.
      const maybeFixMojibake = (x) => {
        if (!x) return x;
        // Substituições diretas dos padrões mais comuns em pt-BR (ex.: TefÃ© → Tefé).
        const directPairs = [
          [/Ã©/g, "é"],
          [/Ã¡/g, "á"],
          [/Ã£/g, "ã"],
          [/Ã¢/g, "â"],
          [/Ãª/g, "ê"],
          [/Ã­/g, "í"],
          [/Ã³/g, "ó"],
          [/Ãµ/g, "õ"],
          [/Ã´/g, "ô"],
          [/Ãº/g, "ú"],
          [/Ã§/g, "ç"],
          [/Ã‰/g, "É"],
          [/Ã/g, "Á"],
          [/Ãƒ/g, "Ã"],
          [/ÃŠ/g, "Ê"],
          [/Ã“/g, "Ó"],
          [/Ã•/g, "Õ"],
          [/Ãš/g, "Ú"],
          [/Ã‡/g, "Ç"],
          [/Âº/g, "º"],
          [/Âª/g, "ª"],
          [/Â /g, " "],
        ];
        let direct = x;
        let touched = false;
        for (const [re, rep] of directPairs) {
          const next = direct.replace(re, rep);
          if (next !== direct) {
            direct = next;
            touched = true;
          }
        }
        if (touched && !/[ÃÂ][^\u0000-\u007F]/.test(direct)) return direct;

        // Heurística segura via latin1→utf-8:
        // - Mojibake típico tem "Ã§", "Ã£", "Â°" etc (Ã/Â seguidos de não-ASCII).
        // - Texto PT-BR válido pode conter "Ã" (ex.: "MANUTENÇÃO"), normalmente seguido de ASCII ("ÃO").
        if (!/[ÃÂ][^\u0000-\u007F]/.test(x)) return touched ? direct : x;
        try {
          const cp1252Map = new Map([
            [0x20ac, 0x80],
            [0x201a, 0x82],
            [0x0192, 0x83],
            [0x201e, 0x84],
            [0x2026, 0x85],
            [0x2020, 0x86],
            [0x2021, 0x87],
            [0x02c6, 0x88],
            [0x2030, 0x89],
            [0x0160, 0x8a],
            [0x2039, 0x8b],
            [0x0152, 0x8c],
            [0x017d, 0x8e],
            [0x2018, 0x91],
            [0x2019, 0x92],
            [0x201c, 0x93],
            [0x201d, 0x94],
            [0x2022, 0x95],
            [0x2013, 0x96],
            [0x2014, 0x97],
            [0x02dc, 0x98],
            [0x2122, 0x99],
            [0x0161, 0x9a],
            [0x203a, 0x9b],
            [0x0153, 0x9c],
            [0x017e, 0x9e],
            [0x0178, 0x9f],
          ]);
          const bytes = Uint8Array.from(x, (ch) => {
            const code = ch.charCodeAt(0);
            if (code <= 0xff) return code;
            const mapped = cp1252Map.get(code);
            return typeof mapped === "number" ? mapped : 0x3f;
          });
          const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
          if (decoded && decoded !== x && !/[ÃÂ][^\u0000-\u007F]/.test(decoded)) return decoded;
          return touched ? direct : decoded || x;
        } catch {
          return touched ? direct : x;
        }
      };
      let out = maybeFixMojibake(s);
      // Normaliza composição de acentos (NFC) para consistência em PT-BR.
      try {
        out = out.normalize("NFC");
      } catch {
        // ignore
      }
      return out;
    }

  app.getFirstNonEmptyValue = function getFirstNonEmptyValue(props, keys) {
      for (const key of keys) {
        const val = props?.[key];
        if (val !== undefined && val !== null && String(val).trim() !== "") return val;
      }
      return "";
    }

  app.formatCoordNumber = function formatCoordNumber(n, digits) {
      const d = typeof digits === "number" ? digits : 6;
      if (typeof n !== "number" || Number.isNaN(n) || !Number.isFinite(n)) return "-";
      return n.toFixed(d);
    }

  app.escapeHtml = function escapeHtml(text) {
      return app.normalizePtBrText(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

  app.isNumericLike = function isNumericLike(value) {
      if (value === null || value === undefined) return false;
      const s = String(value).trim();
      if (!s) return false;
      const normalized = s.replace(/\./g, "").replace(",", ".");
      return !Number.isNaN(Number(normalized));
    }

  app.toNumber = function toNumber(value) {
      const s = String(value).trim().replace(/\./g, "").replace(",", ".");
      return Number(s);
    }

  app.escHtmlCell = function escHtmlCell(value) {
      if (value === null || value === undefined) return "";
      return app.normalizePtBrText(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

  app.looksLikeHtmlOrXmlBlob = function looksLikeHtmlOrXmlBlob(value) {
      const s = String(value ?? "").trim();
      if (s.length < 12) return false;
      if (/<\s*html[\s>]/i.test(s) || /<\s*head[\s>]/i.test(s) || /<\s*body[\s>]/i.test(s)) return true;
      if (/xmlns\s*:/i.test(s) || /urn:schemas-microsoft-com/i.test(s)) return true;
      if (/<\?xml[\s>]/i.test(s)) return true;
      // Tag HTML genérica com fechamento
      if (/<[a-zA-Z][\w:-]*[\s>]/.test(s) && /<\/[a-zA-Z][\w:-]*>/.test(s)) return true;
      return false;
    }

  app.stripHtmlToPlainText = function stripHtmlToPlainText(value) {
      let s = String(value ?? "");
      if (!s) return "";
      if (!app.looksLikeHtmlOrXmlBlob(s) && !/<[a-zA-Z!/?]/.test(s)) return s;
      try {
        s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
        s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
        s = s.replace(/<!--[\s\S]*?-->/g, " ");
        s = s.replace(/<[^>]+>/g, " ");
        s = s
          .replace(/&nbsp;/gi, " ")
          .replace(/&amp;/gi, "&")
          .replace(/&lt;/gi, "<")
          .replace(/&gt;/gi, ">")
          .replace(/&quot;/gi, '"')
          .replace(/&#39;/gi, "'")
          .replace(/&#(\d+);/g, (_, n) => {
            const code = Number(n);
            return Number.isFinite(code) ? String.fromCharCode(code) : "";
          });
        s = s.replace(/\s+/g, " ").trim();
        // Sobras típicas de XSL/FO sem conteúdo útil
        if (!s || /^xmlns:/i.test(s) || /^fo:/i.test(s) || s.length < 2) return "";
        if (/^https?:\/\//i.test(s) && s.length < 12) return "";
        return s;
      } catch {
        return "";
      }
    }

  app.formatAttributeDisplayValue = function formatAttributeDisplayValue(value, key = "") {
      if (value === null || value === undefined) return "";
      let raw = app.normalizePtBrText(value).trim();
      if (!raw) return "";

      const keyLow = String(key || "").toLowerCase();

      if (app.looksLikeHtmlOrXmlBlob(raw) || (/descri/i.test(keyLow) && /<[a-zA-Z!/?]/.test(raw))) {
        raw = app.stripHtmlToPlainText(raw);
        if (!raw) return "";
        if (raw.length > 280) return `${raw.slice(0, 277)}…`;
      }

      const looksLikePath =
        keyLow.includes("source") ||
        keyLow.includes("fonte") ||
        /\.shp$/i.test(raw) ||
        /[/\\]/.test(raw);
      if (looksLikePath) {
        const base = raw.replace(/\\/g, "/").split("/").filter(Boolean).pop() || raw;
        return base.replace(/\.shp$/i, "").trim() || raw;
      }

      // Códigos/IDs com letras, barra ou hífen no meio → manter texto.
      if (/[A-Za-zÀ-ÿ_/]/.test(raw) && !/^-?\d+([.,]\d+)?$/.test(raw)) {
        return raw;
      }

      if (!app.isNumericLike(raw)) return raw;
      const n = app.toNumber(raw);
      if (!Number.isFinite(n)) return raw;
      if (Number.isInteger(n)) return String(n);
      return n.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

  app.escAttributeCell = function escAttributeCell(value, key = "") {
      return app.escHtmlCell(app.formatAttributeDisplayValue(value, key));
    }

}
