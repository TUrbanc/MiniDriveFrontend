# MiniDrive

MiniDrive zagotavlja “mini cloud drive” funkcionalnost:
- avtentikacija uporabnikov z JWT,
- nalaganje / seznam / prenos / brisanje datotek,
- komentiranje datotek,
- deljenje datotek z drugimi uporabniki,
- ustvarjanje javnih (token) povezav za prenos.

---

# API Dokumentacija

Tukaj je opisan HTTP API, ki ga izpostavlja MiniDrive backend in ga uporabljata MiniDrive spletni odjemalec (web frontend) ter MiniDrive Android aplikacija.


## Napake (JSON)

Tipične HTTP kode:
- 400 neveljaven/manjkajoč input
- 401 manjkajoč/neveljaven token
- 403 prepovedano (ni dostopa)
- 404 ni najdeno
- 409 konflikt (npr. uporabniško ime že obstaja)
- 410 gone (potekla povezava / manjkajoča shranjena datoteka)
- 500 napaka strežnika


## API končne točke (endpoints)


### Health

| Pot vstopne točke | Metoda | Medijski tip | Vsebina zahtevka | Opis |
|---|---|---|---|---|
| `/api/health` | GET | JSON | `/` | Health check (vrne `{ ok: true }`). |


### Avtentikacija

| Pot vstopne točke | Metoda | Medijski tip | Vsebina zahtevka | Opis |
|---|---|---|---|---|
| `/api/auth/login` | POST | JSON | `{ "username": "…", "password": "…" }` | Avtenticira uporabnika in vrne JWT (`token`) + informacije o uporabniku. |


### Admin (zaščiteno s “secret”)

Vsi spodnji endpointi zahtevajo `secret` v JSON telesu (preverja se proti `ADMIN_REG_SECRET` v `backend/src/deps.js`).

| Pot vstopne točke | Metoda | Medijski tip | Vsebina zahtevka | Opis |
|---|---|---|---|---|
| `/api/admin/register` | POST | JSON | `{ "secret": "…", "username": "…", "password": "…" }` | Ustvari novega uporabnika. |
| `/api/admin/users/list` | POST | JSON | `{ "secret": "…" }` | Vrne seznam uporabnikov z njihovim številom datotek (`file_count`). |
| `/api/admin/users/delete` | POST | JSON | `{ "secret": "…", "userId": 123 }` | Izbriše uporabnika iz baze in odstrani njegovo mapo s podatki pod `STORAGE_ROOT`. |
| `/api/admin/users/password` | POST | JSON | `{ "secret": "…", "userId": 123, "newPassword": "…" }` | Nastavi novo geslo uporabniku (shrani se bcrypt hash). |


### Datoteke (zahteva JWT)

Vsi spodnji endpointi zahtevajo `Authorization: Bearer <token>` (validacija prek `authRequired()` v `backend/src/deps.js`).

| Pot vstopne točke | Metoda | Medijski tip | Vsebina zahtevka | Opis |
|---|---|---|---|---|
| `/api/files` | GET | JSON | `/` | Vrne seznam datotek prijavljenega uporabnika (`id, original_name, size_bytes, mime_type, created_at`). |
| `/api/files/upload` | POST | `multipart/form-data` | Form field: `file` | Naloži datoteko. Datoteka se shrani pod `STORAGE_ROOT/<userId>/...` in doda se zapis v tabelo `files`. |
| `/api/files/:id` | GET | Binarni tok (stream) | `/` | Prenese datoteko po ID. Dovoljeno, če je uporabnik lastnik, ali če mu je datoteka deljena z `can_download = true`. |
| `/api/files/:id` | DELETE | JSON | `/` | Izbriše datoteko po ID (samo lastnik). Odstrani datoteko iz filesystema (če obstaja) in izbriše DB zapis. |
| `/api/files/:id/comments` | GET | JSON | `/` | Vrne komentarje za datoteko (lastnik ali uporabnik z deljenim dostopom). Vrne elemente z `author` (username). |
| `/api/files/:id/comments` | POST | JSON | `{ "body": "…" }` | Doda komentar na datoteko (lastnik ali shared user). Zavrne prazne komentarje. |


### Deljenje (zahteva JWT)

| Pot vstopne točke | Metoda | Medijski tip | Vsebina zahtevka | Opis |
|---|---|---|---|---|
| `/api/shares/user` | POST | JSON | `{ "fileId": 123, "targetUsername": "…", "canDownload": true }` | Deli datoteko drugemu uporabniku (samo lastnik). Uporablja “upsert”: ponovni share posodobi `can_download`. |
| `/api/shares/user` | DELETE | JSON | `{ "fileId": 123, "targetUsername": "…" }` | Prekliče user-to-user deljenje (samo lastnik). |
| `/api/shares/incoming` | GET | JSON | `/` | Vrne seznam datotek, ki so bile deljene prijavljenemu uporabniku. Vrne share + metadata datoteke in `can_download`. |
| `/api/shares/file/:fileId` | GET | JSON | `/` | Vrne share zapise za datoteko (samo lastnik). Vključi target usernames in permissions. |
| `/api/shares/link` | POST | JSON | `{ "fileId": 123, "expiresInDays": 7, "maxDownloads": 10 }` *(omejitve so opcijske)* | Ustvari javno povezavo za prenos (token). Vrne `{ token, url }`. Omejitve so opcijske; če niso podane/prazne → brez omejitve. |
| `/api/shares/link/:fileId` | GET | JSON | `/` | Vrne seznam link share-ov za datoteko (samo lastnik). Vrne `token`, expiry, max/download counts. |
| `/api/shares/link/:id` | DELETE | JSON | `/` | Izbriše link share po ID (samo lastnik). |


### Javni prenos (brez JWT)

| Pot vstopne točke | Metoda | Medijski tip | Vsebina zahtevka | Opis |
|---|---|---|---|---|
| `/api/public/:token` | GET | Binarni tok (stream) | `/` | Prenese datoteko prek javnega tokena, ustvarjenega z `/api/shares/link`. Upošteva `expires_at` in `max_downloads` (če sta nastavljena) ter poveča `download_count` ob vsakem prenosu. |

---

# Podatkovni Model

<img width="1842" height="695" alt="image" src="https://github.com/user-attachments/assets/50d2cea0-637e-4abf-a19f-124d74d40605" />

