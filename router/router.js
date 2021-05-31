const { Router } = require('express');
const controller = require('../controller/controller');
const router = Router();

// ruta za unosenje glavnog administratora
router.get('/unesi_admina', controller.unesi_admina);
router.post('/unesi_admina', controller.unesi_admina_post);

// signup
router.get('/signup', controller.signup);
router.post('/signup', controller.signup_post);

// login
router.get('/login', controller.login);
router.post('/login', controller.login_post);

// error
router.get('/error', controller.error);

// logout
router.get('/logout', controller.logout);

// admin
router.get('/admin_pocetna', controller.admin_pocetna);
router.get('/admin_restorani', controller.admin_restorani);
router.get('/admin_dodaj_ar/:id', controller.admin_dodaj_ar);
router.post('/admin_dodaj_ar/:id', controller.admin_dodaj_ar_post);
router.get('/admin_dodaj_restoran', controller.admin_dodaj_restoran);
router.post('/admin_dodaj_restoran', controller.admin_dodaj_restoran_post);
router.get('/admin_uredi_restoran/:id', controller.admin_uredi_restoran);
router.post('/admin_uredi_restoran/:id', controller.admin_uredi_restoran_post);
router.delete('/admin_izbrisi_restoran/:id', controller.admin_izbrisi_restoran);
router.get('/admin_meni_restorana/:id_res', controller.admin_meni_restorana);
router.get('/admin_uredi_meni/:id_meni', controller.admin_uredi_meni);
router.post('/admin_uredi_meni/:id_meni', controller.admin_uredi_meni_post);
router.get('/admin_akcije_meni_restorana/:id_akcija', controller.admin_akcije_meni_restorana);
router.get('/admin_uredi_akciju/:id_akcije', controller.admin_uredi_akciju);
router.post('/admin_uredi_akciju/:id_akcije', controller.admin_uredi_akciju_post);
router.delete('/admin_izbrisi_meni/:id_meni', controller.admin_izbrisi_meni);
router.delete('/admin_izbrisi_akciju/:id_akcija', controller.admin_izbrisi_akciju);
router.get('/admin_dodaj_meni/:id_res', controller.admin_dodaj_meni);
router.post('/admin_dodaj_meni/:id_res', controller.admin_dodaj_meni_post);
router.get('/admin_dodaj_akciju/:id_meni', controller.admin_dodaj_akciju);
router.post('/admin_dodaj_akciju/:id_meni', controller.admin_dodaj_akciju_post);

// admin restorana
router.get('/ar_pocetna', controller.ar_pocetna);
router.get('/ar_restoran', controller.ar_restoran);
router.get('/ar_uredi_restoran/:id_res', controller.ar_uredi_restoran);
router.post('/ar_uredi_restoran/:id_res', controller.ar_uredi_restoran_post);
router.get('/ar_dodaj_dostavljaca/:id_res', controller.ar_dodaj_dostavljaca);
router.post('/ar_dodaj_dostavljaca/:id_res', controller.ar_dodaj_dostavljaca_post);
router.get('/ar_meni', controller.ar_meni);
router.get('/ar_dodaj_meni/:id_res', controller.ar_dodaj_meni);
router.post('/ar_dodaj_meni/:id_res', controller.ar_dodaj_meni_post);
router.get('/ar_uredi_meni/:id_meni', controller.ar_uredi_meni);
router.post('/ar_uredi_meni/:id_meni', controller.ar_uredi_meni_post);
router.delete('/ar_meni_izbrisi/:id', controller.ar_meni_izbrisi);
router.get('/ar_akcije/:id_meni', controller.ar_akcije);
router.get('/ar_uredi_akciju/:id_akcije', controller.ar_uredi_akciju);
router.post('/ar_uredi_akciju/:id_akcije', controller.ar_uredi_akciju_post);
router.get('/ar_dodaj_akciju/:id_meni', controller.ar_dodaj_akciju);
router.post('/ar_dodaj_akciju/:id_meni', controller.ar_dodaj_akciju_post);
router.delete('/ar_izbrisi_akciju/:id_akcije', controller.ar_izbrisi_akciju);
router.get('/ar_narudzbe', controller.ar_narudzbe);
router.post('/ar_odobri_narudzbu/:id_narudzbe/:naziv_narudzbe/:ime/:prezime/:korisnik/:adresa/:kolicina/:cijena/:datum_narudzbe/:rok_isporuke/:id_meni/:id_akcije/:id_dos/:id_res/:id_ar', controller.ar_odobri_narudzbu);
router.get('/ar_zavrsene_narudzbe', controller.ar_zavrsene_narudzbe);
router.delete('/ar_izbrisi_zavrsenu_narudzbu/:id_narudzbe', controller.ar_izbrisi_zavrsenu_narudzbu);

// dostavljac
router.get('/dos_pocetna', controller.dos_pocetna);
router.get('/dos_narudzbe', controller.dos_narudzbe);
router.post('/dos_narudzba_isporucena/:id_narudzbe', controller.dos_narudzba_isporucena);
router.get('/dos_zavrsene_narudzbe', controller.dos_zavrsene_narudzbe);

// korisnik
router.get('/kor_pocetna',controller.kor_pocetna);
router.get('/kor_restorani', controller.kor_restorani);
router.get('/kor_meni_restorana/:id_res', controller.kor_meni_restorana);
router.get('/kor_meni_akcije/:id_meni', controller.kor_meni_akcije);
router.get('/kor_naruci_meni1/:id_meni/:naziv/:id_res/:kor_email/:kor_ime/:kor_prezime/:kor_adresa/:cijena', controller.kor_naruci_meni1);
router.post('/kor_naruci_meni1/:id_meni/:naziv/:id_res/:kor_email/:kor_ime/:kor_prezime/:kor_adresa/:cijena', controller.kor_naruci_meni1_post);
router.get('/kor_naruci_akciju1/:id_meni/:naziv_akcije/:id_res/:kor_email/:kor_ime/:kor_prezime/:kor_adresa/:akcijska_cijena/:id_akcije', controller.kor_naruci_akciju1);
router.post('/kor_naruci_akciju1/:id_meni/:naziv_akcije/:id_res/:kor_email/:kor_ime/:kor_prezime/:kor_adresa/:akcijska_cijena/:id_akcije', controller.kor_naruci_akciju1_post);
router.get('/kor_narudzbe', controller.kor_narudzbe);
router.delete('/kor_izbrisi_zavrsenu_narudzbu/:id_narudzbe', controller.kor_izbrisi_zavrsenu_narudzbu);

module.exports = router;