import fs from "fs";
import path from "path";
import {
  eliminaImmagineContenuto,
  percorsoContenuto,
} from "../../app/middleware/upload";
import { ValidationError } from "../../app/errors/AppError";
import { env } from "../../config/env";

const DIR_CONTENUTI = path.join(env.uploadsDir, "quill");

describe("Gestione dei file caricati", () => {
  describe("percorsoContenuto", () => {
    it("produce un percorso relativo servibile su /uploads", () => {
      const file = { filename: "123-abcd.png" } as Express.Multer.File;
      expect(percorsoContenuto(file)).toBe("uploads/quill/123-abcd.png");
    });
  });

  describe("eliminaImmagineContenuto", () => {
    it.each([
      ["risalita con ../", "../../.env"],
      ["risalita con ..\\", "..\\..\\.env"],
      ["percorso assoluto", "/etc/passwd"],
      ["separatore incorporato", "quill/altro.png"],
      ["file nascosto", ".env"],
    ])("rifiuta %s", async (_etichetta, nomeFile) => {
      await expect(eliminaImmagineContenuto(nomeFile)).rejects.toBeInstanceOf(
        ValidationError,
      );
    });

    it("segnala l'assenza del file senza sollevare eccezioni", async () => {
      await expect(
        eliminaImmagineContenuto("file-inesistente-1234.png"),
      ).resolves.toBe(false);
    });

    it("elimina un file presente nella cartella dei contenuti", async () => {
      const nomeFile = `test-${Date.now()}.png`;
      const percorso = path.join(DIR_CONTENUTI, nomeFile);
      fs.writeFileSync(percorso, "contenuto di prova");

      await expect(eliminaImmagineContenuto(nomeFile)).resolves.toBe(true);
      expect(fs.existsSync(percorso)).toBe(false);
    });

    it("non tocca i file al di fuori della cartella dei contenuti", async () => {
      const esca = path.join(env.uploadsDir, "esca.txt");
      fs.writeFileSync(esca, "non deve essere eliminato");

      try {
        await expect(
          eliminaImmagineContenuto("../esca.txt"),
        ).rejects.toBeInstanceOf(ValidationError);
        expect(fs.existsSync(esca)).toBe(true);
      } finally {
        fs.unlinkSync(esca);
      }
    });
  });
});
