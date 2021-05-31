const express = require('express');
const jwt = require('jsonwebtoken');
const jwtt = require('../middleware/middleware');
const bcrypt = require('bcrypt');
const { pool } = require('../db/db');

// moje funkcije da na startu rada ovog projekta unesem glavnog admina i da mu bude hashovan password

module.exports.unesi_admina = (req,res) => {
    res.render('unesi_admina');
}

module.exports.unesi_admina_post = async (req,res) => {
    const { email, password } = req.body;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password,salt);

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'insert into administrator (email,password) values ($1,$2)';
        client.query(clientQuery,[email,hashedPassword], function(err,result){
            done();
            if(err){console.log(err);}
            console.log('Dodan admin: ' + email + ' ' + password + ' ' + hashedPassword);
            res.redirect('/');
        });
    });
}

// signup funkcije (vazi samo za korisnike)

module.exports.signup = (req,res) => {
    console.log('RUTA: ' + req.url);
    res.render('signup');
}

module.exports.signup_post = (req,res) => {
    const {ime,prezime,adresa,email,password,password1} = req.body;
    if(password!==password1){
        console.log('Passwordi moraju biti isti');
        res.redirect('/signup');
    }
    
    pool.connect(async function(err,client,done){
        if(err){console.log(err);}
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password,salt);
        var clientQuery = 'insert into korisnik (email,password,ime,prezime,adresa) values ($1,$2,$3,$4,$5)';
        client.query(clientQuery,[email,hashedPassword,ime,prezime,adresa],function(err,result){
            done();
            if(err){console.log(err);}
            console.log('Dodan korisnik: ' + email + ' ' + password + ' ' + hashedPassword);
            res.redirect('/');
        });
    });
}

// login funkcije (vrijede za sve)

module.exports.login = (req,res) => {
    console.log('RUTA: ' + req.url);
    res.render('login');
}

module.exports.login_post = (req,res) => {
    const {ko,email,password} = req.body;
    var stranica;
    var clientQuery;
    if(ko==='administrator'){stranica='/admin_pocetna'; clientQuery='select id,email,password from administrator where email=$1'}
    if(ko==='administrator_restorana'){stranica='/ar_pocetna'; clientQuery='select id,email,password from administrator_restorana where email=$1'}
    if(ko==='dostavljac'){stranica='/dos_pocetna'; clientQuery='select id,email,password from dostavljac where email=$1'}
    if(ko==='korisnik'){stranica='/kor_pocetna'; clientQuery='select id,email,password from korisnik where email=$1'}
    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        client.query(clientQuery,[email],async function(err,result){
            if(err){console.log(err);}
            console.log(result.rows[0]);
            const authClient = await bcrypt.compare(password,result.rows[0].password);
            if(authClient){
                const token = await jwtt.createToken(result.rows[0].id,result.rows[0].email);
                res.cookie('jwt', token, { maxAge: 840000 * 10 });
                res.redirect(stranica);
            }else{
                res.redirect('/error');
            }
        })
    })
}

module.exports.logout = (req,res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/');
}

// error (greska prilikom logovanja)
module.exports.error = (req,res) => {
    console.log('ERROR');
    res.render('error');
}

// administrator

module.exports.admin_pocetna = (req,res) => {
    console.log('RUTA: ' + req.url);
    res.render('admin_pocetna');
}

module.exports.admin_restorani = (req,res) => {
    console.log('RUTA: ' + req.url);
    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select * from restorani';
        client.query(clientQuery,[],function(err,result){
            done();
            if(err){console.log(err);}
            //console.log(result.rows);
            res.render('admin_restorani', { result: result.rows });
        });
    });
}

module.exports.admin_dodaj_ar = (req,res) => {
    console.log('RUTA: ' + req.url);
    res.render('admin_dodaj_ar');
}

module.exports.admin_dodaj_ar_post = async (req,res) => {
    const {email,password,password1} = req.body;
    const id_restorana = req.params.id;
    if(password!==password1){
        console.log('Mora biti isti password');
        res.redirect('/admin_restorani');
    }

    await pool.connect(async function(err,client,done){
        if(err){console.log(err);}
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password,salt);
        // prvo dodajemo ar u tabelu administratora restorana
        var clientQuery = 'insert into administrator_restorana (email,password) values ($1,$2)';
        client.query(clientQuery,[email,hashedPassword],async function(err,result){
            done();
            if(err){console.log(err);}
            console.log('DODAN ar: ' + email + ' ' + password);
            var id_ar;
            await pool.connect(function(err,client,done){
                if(err){console.log(err);}
                // clientquery2: uzimamo njegov id iz tabele administrator restorana i pohranjujemo u var id_ar
                var clientQuery = 'select id,email from administrator_restorana where email=$1';
                client.query(clientQuery,[email],async function(err,result){
                    done();
                    if(err){console.log(err);}
                    console.log('clientQuery2');
                    //console.log(result.rows);
                    id_ar=result.rows[0].id;
                    await pool.connect(function(err,client,done){
                        if(err){console.log(err);}
                        // clientquery3: stavljamo u tabelu restorani id_ar id ovog ar
                        var clientQuery = 'UPDATE restorani SET id_ar = $1 WHERE id = $2';
                        client.query(clientQuery,[id_ar,id_restorana],function(err,result){
                            done();
                            if(err){console.log(err);}
                            console.log('clientQuery3');
                            console.log('Dodan administrator restorana!');
                            res.redirect('/admin_restorani')
                        });
                    });
                });
            });
        });
    });
    
}

module.exports.admin_dodaj_restoran = (req,res) => {
    console.log('RUTA: ' + req.url);
    res.render('admin_dodaj_restoran');
}

module.exports.admin_dodaj_restoran_post = (req,res) => {
    const {naziv,grad,kategorija,zvjezdice,dodatno} = req.body;

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'insert into restorani(naziv,grad,kategorija,zvjezdice,dodatno) values($1,$2,$3,$4,$5)';
        client.query(clientQuery,[naziv,grad,kategorija,zvjezdice,dodatno],function(err,result){
            done();
            if(err){console.log(err);}
            console.log('DODAN restoran: ' + naziv);
            res.redirect('/admin_pocetna');
        });
    });
}

module.exports.admin_uredi_restoran = (req,res) => {
    console.log('RUTA: ' + req.url);
    const idd = req.params.id;
    console.log(idd);
    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select naziv,grad,kategorija,zvjezdice,dodatno from restorani where id=$1';
        client.query(clientQuery,[idd],function(err,result){
            done();
            if(err){console.log(err);}
            //console.log(result.rows[0]);
            res.render('admin_uredi_restoran', {result: result.rows});
        });
    });
}

module.exports.admin_uredi_restoran_post = (req,res) => {
    const {naziv,grad,kategorija,zvjezdice,dodatno} = req.body;
    var idd = req.params.id;

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'UPDATE restorani SET naziv=$1, grad=$2, kategorija=$3, zvjezdice=$4, dodatno=$5 WHERE id=$6';
        client.query(clientQuery,[naziv,grad,kategorija,zvjezdice,dodatno,idd],function(err,result){
            done();
            if(err){console.log(err);}
            res.redirect('/admin_restorani');
        });
    });
}

module.exports.admin_izbrisi_restoran =async (req,res) => {
    var idd=req.params.id;
    var id_ar;
    await pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select id_ar,id_dos from restorani where id=$1';
        client.query(clientQuery,[idd],async function(err,result){
            done();
            if(err){console.log(err);}
            //console.log('sadasdasdasdasd '+result.rows[0].id_ar);
            id_ar=result.rows[0].id_ar;
            var id_dos=result.rows[0].id_dos;
            await pool.connect(function(err,client,done){
                if(err){console.log(err);}
                var clientQuery = 'DELETE FROM administrator_restorana WHERE id=$1';
                client.query(clientQuery,[id_ar],async function(err,result){
                    done();
                    if(err){console.log(err);}
                    console.log('Izbrisan restoran ' + idd);
                    await pool.connect(function(err,client,done){
                        if(err){console.log(err);}
                        var clientQuery = 'delete from meni where id_ar=$1';
                        client.query(clientQuery,[id_ar],async function(err,result){
                            done();
                            if(err){console.log(err);}
                            await pool.connect(function(err,client,done){
                                if(err){console.log(err);}
                                var clientQuery = 'delete from restorani where id_ar=$1';
                                client.query(clientQuery,[id_ar],async function(err,result){
                                    done();
                                    if(err){console.log(err);}
                                    await pool.connect(function(err,client,done){
                                        if(err){console.log(err);}
                                        var clientQuery = 'delete from akcija where id_ar=$1';
                                        client.query(clientQuery,[id_ar],function(err,result){
                                            done();
                                            if(err){console.log(err);}
                                            pool.connect(function(err,client,done){
                                                if(err){console.log(err);}
                                                var clientQuery = 'delete from dostavljac where id=$1';
                                                client.query(clientQuery,[id_dos],function(err,result){
                                                    done();
                                                    if(err){console.log(err);}
                                                    pool.connect(function(err,client,done){
                                                        if(err){console.log(err);}
                                                        var clientQuery = 'delete from narudzbe_ar where id_ar=$1';
                                                        client.query(clientQuery,[id_ar],function(err,result){
                                                            done();
                                                            if(err){console.log(err);}
                                                            pool.connect(function(err,client,done){
                                                                if(err){console.log(err);}
                                                                var clientQuery = 'delete from narudzbe_ar_izvrsene where id_ar=$1';
                                                                client.query(clientQuery,[id_ar],function(err,result){
                                                                    done();
                                                                    if(err){console.log(err);}
                                                                    pool.connect(function(err,client,done){
                                                                        if(err){console.log(err);}
                                                                        var clientQuery = 'delete from narudzbe_dos where id_ar=$1';
                                                                        client.query(clientQuery,[id_ar],function(err,result){
                                                                            done();
                                                                            if(err){console.log(err);}
                                                                            res.sendStatus(200);
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

module.exports.admin_meni_restorana = async (req,res) => {
    console.log('RUTA: ' + req.url);
    const id_res = req.params.id_res;

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select id,naziv,predjelo,glavno_jelo,desert,cijena from meni where id_res=$1';
        client.query(clientQuery,[id_res],function(err,result){
            done();
            if(err){console.log(err);}
            res.render('admin_meni_restorana', {result: result.rows, restoran: id_res});
        });
    });
}

module.exports.admin_uredi_meni = async (req,res) => {
    console.log('RUTA: ' + req.url);
    const id_meni = req.params.id_meni;

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select naziv,predjelo,glavno_jelo,desert,cijena from meni where id=$1';
        client.query(clientQuery,[id_meni],function(err,result){
            done();
            if(err){console.log(err);}
            res.render('admin_uredi_meni', {result: result.rows});
        });
    });
}

module.exports.admin_uredi_meni_post = async (req,res) => {
    console.log('RUTA: ' + req.url);
    const id_meni = req.params.id_meni;
    const {naziv,predjelo,glavno_jelo,desert,cijena} = req.body;

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'UPDATE meni SET naziv=$1, predjelo=$2, glavno_jelo=$3, desert=$4, cijena=$5 WHERE id=$6';
        client.query(clientQuery,[naziv,predjelo,glavno_jelo,desert,cijena,id_meni],function(err,result){
            done();
            if(err){console.log(err);}
            res.redirect('/admin_pocetna');
        });
    });
}

module.exports.admin_akcije_meni_restorana = async (req,res) => {
    console.log('RUTA: ' + req.url);
    const id_akcija = req.params.id_akcija;

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select a.id, a.naziv_akcije, a.pocetak, m.naziv, a.kraj, a.akcijska_cijena from meni m inner join akcija a on m.id_akcija = a.id where m.id=$1';
        client.query(clientQuery,[id_akcija],function(err,result){
            done();
            if(err){console.log(err);}
            res.render('admin_akcije_meni_restorana', {result: result.rows, id_meni: id_akcija});
        });
    });
}

module.exports.admin_uredi_akciju = async (req,res) => {
    console.log('RUTA: ' + req.url);
    var id_akcije = req.params.id_akcije;
    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select naziv_akcije, pocetak, kraj, akcijska_cijena from akcija where id=$1';
        client.query(clientQuery,[id_akcije],function(err,result){
            done();
            if(err){console.log(err);}
            res.render('admin_uredi_akciju', {result: result.rows});
        });
    });
}

module.exports.admin_uredi_akciju_post = async (req,res) => {
    console.log('RUTA: ' + req.url);
    const {naziv_akcije, pocetak, kraj, akcijska_cijena} = req.body;
    var id_akcije = req.params.id_akcije;
    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'UPDATE akcija SET naziv_akcije=$1, pocetak=$2, kraj=$3, akcijska_cijena=$4  WHERE id=$5';
        client.query(clientQuery,[naziv_akcije, pocetak, kraj, akcijska_cijena,id_akcije],function(err,result){
            done();
            if(err){console.log(err);}
            res.redirect('/admin_pocetna');
        });
    });  
}

module.exports.admin_izbrisi_meni = async (req,res) => {
    var id_meni=req.params.id_meni;
    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'DELETE FROM meni WHERE id=$1';
        client.query(clientQuery,[id_meni],function(err,result){
            done();
            if(err){console.log(err);}
            res.sendStatus(200);
        });
    });
}

module.exports.admin_izbrisi_akciju = async (req,res) => {
    const id_akcija = req.params.id_akcija;

    await pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'UPDATE meni SET id_akcija = null WHERE id_akcija = $1';
        client.query(clientQuery,[id_akcija],async function(err,result){
            done();
            if(err){console.log(err);}
            await pool.connect(function(err,client,done){
                if(err){console.log(err);}
                var clientQuery = 'delete from akcija where id=$1';
                client.query(clientQuery,[id_akcija],function(err,result){
                    done();
                    if(err){console.log(err);}
                    console.log('Izbrisana akcija ' + id_akcija);
                    res.sendStatus(200);
                });
            });
        });
    });
}

module.exports.admin_dodaj_meni = async (req,res) => {
    console.log('RUTA: ' + req.url);
    res.render('admin_dodaj_meni');
}

module.exports.admin_dodaj_meni_post = async (req,res) => {
    const id_res = req.params.id_res;
    const {naziv,predjelo,glavno_jelo,desert,cijena} = req.body;
    var id_ar;

    await pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select id_ar from restorani where id=$1';
        client.query(clientQuery,[id_res],async function(err,result){
            done();
            if(err){console.log(err);}
            id_ar = result.rows[0].id_ar;
            await pool.connect(function(err,client,done){
                if(err){console.log(err);}
                var clientQuery = 'insert into meni (naziv,predjelo,glavno_jelo,desert,cijena,id_res,id_ar) values ($1,$2,$3,$4,$5,$6,$7)';
                client.query(clientQuery,[naziv,predjelo,glavno_jelo,desert,cijena,id_res,id_ar],function(err,result){
                    done();
                    if(err){console.log(err);}
                    console.log('Dodan meni ' + id_ar);
                    res.redirect('/admin_meni_restorana/'+id_res);
                });
            });
        });
    });
}

module.exports.admin_dodaj_akciju = async (req,res) => {
    console.log('RUTA: ' + req.url);
    res.render('admin_dodaj_akciju');
}

module.exports.admin_dodaj_akciju_post = async (req,res) => {
    const id_meni = req.params.id_meni;
    const token = req.cookies.jwt;
    const {naziv_akcije, pocetak, kraj, akcijska_cijena} = req.body;
    var id_ar;
    await pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select id_ar from meni where id=$1';
        client.query(clientQuery,[id_meni],async function(err,result){
            done();
            if(err){console.log(err);}
            id_ar = result.rows[0].id_ar;
            await pool.connect(function(err,client,done){
                if(err){console.log(err);}
                var clientQuery = 'insert into akcija (naziv_akcije, pocetak, kraj, akcijska_cijena,id_ar,id_meni) values ($1,$2,$3,$4,$5,$6)';
                client.query(clientQuery,[naziv_akcije, pocetak, kraj, akcijska_cijena,id_ar,id_meni],async function(err,result){
                    done();
                    if(err){console.log(err);}
                    console.log('Dodana akcija za meni' + id_meni);
                    var id_akcija;
                    await pool.connect(function(err,client,done){
                        if(err){console.log(err);}
                        var clientQuery = 'select id from akcija where id_ar=$1';
                        client.query(clientQuery,[id_ar],function(err,result){
                            done();
                            if(err){console.log(err);}
                            id_akcija=result.rows[0].id;
                            pool.connect(function(err,client,done){
                                if(err){console.log(err);}
                                var clientQuery = 'update meni set id_akcija=$1 where id=$2';
                                client.query(clientQuery,[id_akcija,id_meni],function(err,result){
                                    done();
                                    if(err){console.log(err);}
                                    res.redirect('/admin_pocetna');
                                });
                            });
                            
                        });
                    });
                    
                });
            });
        });
    });
    
}

// administrator restorana

module.exports.ar_pocetna =async (req,res) => {
    console.log('RUTA: ' + req.url);   
    res.render('ar_pocetna');
}

module.exports.ar_restoran =async (req,res) => {
    console.log('RUTA: ' + req.url);
    const token = req.cookies.jwt;
    var id_ar;
    await jwt.verify(token, 'avdo secret', function(err,result){
        if(err){console.log(err);}
        id_ar=result.id;
        //console.log(result.id);
    });

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select id,naziv,grad,kategorija,zvjezdice,dodatno,id_dos from restorani where id_ar=$1';
        client.query(clientQuery,[id_ar],function(err,result){
            done();
            if(err){console.log(err);}
            res.render('ar_restoran', {result: result.rows});
        });
    });
}

module.exports.ar_uredi_restoran =async (req,res) => {
    console.log('RUTA: ' + req.url);
    const token = req.cookies.jwt;
    const id_res = req.params.id_res;
    var id_ar;
    await jwt.verify(token, 'avdo secret', function(err,result){
        if(err){console.log(err);}
        id_ar=result.id;
    });
    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select naziv,grad,kategorija,zvjezdice,dodatno from restorani where id=$1';
        client.query(clientQuery,[id_res],function(err,result){
            done();
            if(err){console.log(err);}
            //console.log(result.rows);
            res.render('ar_uredi_restoran', {result: result.rows});
        });
    });
}

module.exports.ar_uredi_restoran_post = (req,res) => {
    const {naziv,grad,kategorija,zvjezdice,dodatno} = req.body;
    const id_res = req.params.id_res;

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'UPDATE restorani SET naziv=$1, grad=$2, kategorija=$3, zvjezdice=$4, dodatno=$5 WHERE id=$6';
        client.query(clientQuery,[naziv,grad,kategorija,zvjezdice,dodatno,id_res],function(err,result){
            done();
            if(err){console.log(err);}
            console.log('Uređen restoran' + id_res);
            res.redirect('/ar_restoran');
        });
    });
    
}

module.exports.ar_dodaj_dostavljaca = (req,res) => {
    console.log('RUTA: ' + req.url);
    res.render('ar_dodaj_dostavljaca');
}

module.exports.ar_dodaj_dostavljaca_post =async (req,res) => {
    const {email,password,password1} = req.body;
    if(password!==password1){
        console.log('Paswordi se moraju podudarati');
        res.redirect('/ar_dodaj_dostavljaca');
    }
    
    await pool.connect(async function(err,client,done){
        if(err){console.log(err);}
        const id_res = req.params.id_res;
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password,salt);
        var clientQuery = 'insert into dostavljac (email,password) values ($1,$2)';
        client.query(clientQuery,[email,hashedPassword],async function(err,result){
            done();
            if(err){console.log(err);}
            console.log('Dodan dostavljac ' + ' ' + email + ' ' + password + ' ' + hashedPassword);
            await pool.connect(function(err,client,done){
                if(err){console.log(err);}
                var clientQuery = 'select id from dostavljac where email=$1';
                client.query(clientQuery,[email],async function(err,result){
                    done();
                    if(err){console.log(err);}
                    var id_dos = result.rows[0].id;
                    console.log(id_dos);
                    await pool.connect(function(err,client,done){
                        if(err){console.log(err);}
                        var clientQuery = 'UPDATE restorani SET id_dos = $1 WHERE id = $2';
                        client.query(clientQuery,[id_dos,id_res],function(err,result){
                            done();
                            if(err){console.log(err);}
                            console.log('Dodan dostavljac ' + ' ' + email + ' ' + password + ' za restoran ' + id_res);
                            res.redirect('/ar_restoran');
                        });
                    });
                    
                });
            });
            
        });
    });
}

module.exports.ar_meni =async (req,res) => {
    console.log('RUTA: ' + req.url);
    const token = req.cookies.jwt;
    var id_ar;
    await jwt.verify(token, 'avdo secret',function(err,result){
        if(err){console.log(err);}
        id_ar=result.id;
    });
    // uzimam id za restoran
    await pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select id from restorani where id_ar=$1';
        client.query(clientQuery,[id_ar],async function(err,result){
            done();
            if(err){console.log(err);}
            //console.log(result.rows[0].id);
            var id_res;
            id_res=result.rows[0].id;
            // uzimanje podataka za meni za taj restoran
            await pool.connect(function(err,client,done){
                if(err){console.log(err);}
                var clientQuery = 'select id,naziv,predjelo,glavno_jelo,desert,cijena from meni where id_res=$1';
                client.query(clientQuery,[id_res],function(err,result){
                    done();
                    if(err){console.log(err);}
                    //console.log(result.rows);
                    res.render('ar_meni', {result: result.rows, restoran: id_res});
                });
            });
        });
    });
}

module.exports.ar_uredi_meni = (req,res) => {
    console.log('RUTA: ' + req.url);
    var id_meni = req.params.id_meni;

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select naziv,predjelo,glavno_jelo,desert,cijena from meni where id=$1';
        client.query(clientQuery,[id_meni],function(err,result){
            done();
            if(err){console.log(err);}
            console.log(result.rows);
            res.render('ar_uredi_meni', {result: result.rows});
        });
    });
    
}

module.exports.ar_uredi_meni_post = (req,res) => {
    //console.log('RUTA: ' + req.url);
    const {naziv,predjelo,glavno_jelo,desert,cijena} = req.body;
    var id_meni = req.params.id_meni;

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'UPDATE meni SET naziv=$1, predjelo=$2, glavno_jelo=$3, desert=$4, cijena=$5 WHERE id=$6';
        client.query(clientQuery,[naziv,predjelo,glavno_jelo,desert,cijena,id_meni],function(err,result){
            done();
            if(err){console.log(err);}
            res.redirect('/ar_meni');
        });
    });
    
}

module.exports.ar_dodaj_meni = (req,res) =>{
    console.log('RUTA: ' + req.url);
    res.render('ar_dodaj_meni');
}

module.exports.ar_dodaj_meni_post =async (req,res) => {
    const token = req.cookies.jwt;
    const id_res = req.params.id_res;
    const {naziv,predjelo,glavno_jelo,desert,cijena} = req.body;
    var id_ar;
    await jwt.verify(token, 'avdo secret',function(err,result){
        if(err){console.log(err);}
        id_ar=result.id;
    });
    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'insert into meni (naziv,predjelo,glavno_jelo,desert,cijena,id_res,id_ar) values ($1,$2,$3,$4,$5,$6,$7)';
        client.query(clientQuery,[naziv,predjelo,glavno_jelo,desert,cijena,id_res,id_ar],function(err,result){
            done();
            if(err){console.log(err);}
            console.log('Dodan meni ' + id_ar);
            res.redirect('/ar_meni');
        });
    });
    
}

module.exports.ar_meni_izbrisi = (req,res) => {
    var idd=req.params.id;
    
    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'DELETE FROM meni WHERE id=$1';
        client.query(clientQuery,[idd],function(err,result){
            done();
            if(err){console.log(err);}
            console.log('Izbrisan meni ' + idd);
            res.sendStatus(200);
        });
    });
}

module.exports.ar_akcije = (req,res) => {
    console.log('RUTA: ' + req.url);
    const id_meni = req.params.id_meni;

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select a.id, a.naziv_akcije, a.pocetak, m.naziv, a.kraj, a.akcijska_cijena from meni m inner join akcija a on m.id_akcija = a.id where m.id=$1';
        client.query(clientQuery,[id_meni],function(err,result){
            done();
            if(err){console.log(err);}
            res.render('ar_akcije', {result: result.rows, meni: id_meni});
        });
    });
}

module.exports.ar_uredi_akciju = (req,res) => {
    console.log('RUTA: ' + req.url);
    var id_akcije = req.params.id_akcije;
    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select naziv_akcije, pocetak, kraj, akcijska_cijena from akcija where id=$1';
        client.query(clientQuery,[id_akcije],function(err,result){
            done();
            if(err){console.log(err);}
            res.render('ar_uredi_akciju', {result: result.rows});
        });
    });   
}

module.exports.ar_uredi_akciju_post = (req,res) => {
    console.log('RUTA: ' + req.url);
    const {naziv_akcije, pocetak, kraj, akcijska_cijena} = req.body;
    var id_akcije = req.params.id_akcije;
    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'UPDATE akcija SET naziv_akcije=$1, pocetak=$2, kraj=$3, akcijska_cijena=$4  WHERE id=$5';
        client.query(clientQuery,[naziv_akcije, pocetak, kraj, akcijska_cijena,id_akcije],function(err,result){
            done();
            if(err){console.log(err);}
            res.redirect('/ar_meni');
        });
    });   
}

module.exports.ar_dodaj_akciju = (req,res) => {
    console.log('RUTA: ' + req.url);
    res.render('ar_dodaj_akciju');
}

module.exports.ar_dodaj_akciju_post =async (req,res) => {
    const id_meni = req.params.id_meni;
    const token = req.cookies.jwt;
    const {naziv_akcije, pocetak, kraj, akcijska_cijena} = req.body;
    var id_ar;
    await jwt.verify(token, 'avdo secret',function(err,result){
        if(err){console.log(err);}
        id_ar=result.id;
    });
    await pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'insert into akcija (naziv_akcije, pocetak, kraj, akcijska_cijena,id_ar,id_meni) values ($1,$2,$3,$4,$5,$6)';
        client.query(clientQuery,[naziv_akcije, pocetak, kraj, akcijska_cijena,id_ar,id_meni],async function(err,result){
            done();
            if(err){console.log(err);}
            console.log('Dodana akcija za meni' + id_meni);
            var id_akcija;
            await pool.connect(function(err,client,done){
                if(err){console.log(err);}
                var clientQuery = 'select id from akcija where id_ar=$1';
                client.query(clientQuery,[id_ar],function(err,result){
                    done();
                    if(err){console.log(err);}
                    id_akcija=result.rows[0].id;
                    pool.connect(function(err,client,done){
                        if(err){console.log(err);}
                        var clientQuery = 'update meni set id_akcija=$1 where id=$2';
                        client.query(clientQuery,[id_akcija,id_meni],function(err,result){
                            done();
                            if(err){console.log(err);}
                            res.redirect('/ar_meni');
                        });
                    });
                    
                });
            });
            
        });
    });
    
}

module.exports.ar_izbrisi_akciju =async (req,res) => {
    console.log('RUTA: ' + req.url);
    const id_akcije = req.params.id_akcije;

    await pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'UPDATE meni SET id_akcija = null WHERE id_akcija = $1';
        client.query(clientQuery,[id_akcije],async function(err,result){
            done();
            if(err){console.log(err);}
            await pool.connect(function(err,client,done){
                if(err){console.log(err);}
                var clientQuery = 'delete from akcija where id=$1';
                client.query(clientQuery,[id_akcije],function(err,result){
                    done();
                    if(err){console.log(err);}
                    console.log('Izbrisana akcija ' + id_akcije);
                    res.sendStatus(200);
                });
            });
        });
    });
    
}

module.exports.ar_narudzbe =async (req,res) => {
    console.log('RUTA: ' + req.url);
    const token = req.cookies.jwt;
    var id_ar;
    await jwt.verify(token, 'avdo secret',function(err,result){
        if(err){console.log(err);}
        id_ar=result.id;
    });

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select * from narudzbe_ar where id_ar=$1';
        client.query(clientQuery,[id_ar],function(err,result){
            done();
            if(err){console.log(err);}
            res.render('ar_narudzbe', {result: result.rows});
        });
    });
    
}

module.exports.ar_odobri_narudzbu = async (req,res) => {
    const {id_narudzbe,naziv_narudzbe,ime,prezime,korisnik,adresa,
    kolicina,cijena,datum_narudzbe,rok_isporuke,id_meni,id_akcije,id_dos,id_res,id_ar} = req.params;

    await pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = `insert into narudzbe_dos (naziv_narudzbe,ime,prezime,korisnik,adresa,
            kolicina,cijena,datum_narudzbe,rok_isporuke,id_meni,id_akcije,id_dos,id_res,id_ar,status) values 
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`;
        client.query(clientQuery,[naziv_narudzbe,ime,prezime,korisnik,adresa,
            kolicina,cijena,datum_narudzbe,rok_isporuke,id_meni,id_akcije,id_dos,id_res,id_ar,'NIJE ISPORUCENO'],async function(err,result){
            done();
            if(err){console.log(err);}
            console.log('Odobrena i dodana narudzba dostavljacu');
            await pool.connect(function(err,client,done){
                if(err){console.log(err);}
                var clientQuery = 'delete from narudzbe_ar where id=$1';
                client.query(clientQuery,[id_narudzbe],function(err,result){
                    done();
                    if(err){console.log(err);}
                    console.log('I izbrisana iz baze za ar odobravanje');
                    res.sendStatus(200);
                });
            });
        });
    });
}

module.exports.ar_zavrsene_narudzbe = async (req,res) => {
    console.log('RUTA: ' + req.url);
    const token = req.cookies.jwt;
    var id_ar;
    await jwt.verify(token, 'avdo secret',function(err,result){
        if(err){console.log(err);}
        id_ar=result.id;
    });

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select * from narudzbe_ar_izvrsene where id_ar=$1';
        client.query(clientQuery,[id_ar],function(err,result){
            done();
            if(err){console.log(err);}
            var result = result.rows;
            res.render('ar_zavrsene_narudzbe', {result: result});
        });
    });
}

module.exports.ar_izbrisi_zavrsenu_narudzbu = async (req,res) => {
    const {id_narudzbe} = req.params;

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'delete from narudzbe_ar_izvrsene where id=$1';
        client.query(clientQuery,[id_narudzbe],function(err,result){
            done();
            if(err){console.log(err);}
            console.log('Izbrisana zavrsena narudzba');
            res.sendStatus(200);
        });
    });
}

// dostavljac

module.exports.dos_pocetna = (req,res) => {
    console.log('RUTA: ' + req.url);
    res.render('dos_pocetna');
}

module.exports.dos_narudzbe =async (req,res) => {
    console.log('RUTA: ' + req.url);
    const token = req.cookies.jwt;
    var id_dos;
    await jwt.verify(token, 'avdo secret', function(err,result){
        if(err){console.log(err);}
        id_dos=result.id;
    });

    var date_ob = new Date();
    var date = ("0" + date_ob.getDate()).slice(-2);
    var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    var year = date_ob.getFullYear();
    var hours = date_ob.getHours();
    var minutes = date_ob.getMinutes();
    var datum = date+'.'+month+'.'+year;

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = `select * from narudzbe_dos where id_dos=$1 and datum_narudzbe=$2`;
        client.query(clientQuery,[id_dos,datum],function(err,result){
            done();
            if(err){console.log(err);}
            res.render('dos_narudzbe', {result: result.rows});
        });
    });
    
}

module.exports.dos_narudzba_isporucena = (req,res) => {
    const {id_narudzbe} = req.params;

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'UPDATE narudzbe_dos SET status=$1 WHERE id=$2';
        client.query(clientQuery,['ISPORUCENO',id_narudzbe],async function(err,result){
            done();
            if(err){console.log(err);}
            console.log('Isporucena narudzba');
            await pool.connect(function(err,client,done){
                if(err){console.log(err);}
                var clientQuery = `select * from narudzbe_dos where id=$1`;
                client.query(clientQuery,[id_narudzbe],async function(err,result){
                    done();
                    if(err){console.log(err);}
                    var rezultat = result.rows[0];
                    await pool.connect(function(err,client,done){
                        if(err){console.log(err);}
                        var clientQuery = `insert into narudzbe_ar_izvrsene (naziv_narudzbe,ime,prezime,korisnik,adresa,
                            kolicina,cijena,datum_narudzbe,rok_isporuke,id_meni,id_akcije,id_dos,id_res,id_ar,status) values 
                            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`;
                        client.query(clientQuery,[rezultat.naziv_narudzbe,rezultat.ime,rezultat.prezime,
                        rezultat.korisnik,rezultat.adresa,rezultat.kolicina,rezultat.cijena,rezultat.datum_narudzbe,
                        rezultat.rok_isporuke,rezultat.id_meni,rezultat.id_akcije,rezultat.id_dos,
                        rezultat.id_res,rezultat.id_ar,'ISPORUCENO'],function(err,result){
                            done();
                            if(err){console.log(err);}
                            res.sendStatus(200);
                        });
                    });
                });
            });
        });
    });
}

module.exports.dos_zavrsene_narudzbe = async (req,res) => {
    console.log('RUTA: ' + req.url);
    const token = req.cookies.jwt;
    var id_dos;

    await jwt.verify(token, 'avdo secret', function(err,result){
        if(err){console.log(err);}
        id_dos=result.id;
    });

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select * from narudzbe_ar_izvrsene where id_dos=$1';
        client.query(clientQuery,[id_dos],function(err,result){
            done();
            if(err){console.log(err);}
            res.render('dos_zavrsene_narudzbe', {result: result.rows});
        });
    });
}

// korisnik

module.exports.kor_pocetna = (req,res) => {
    console.log('RUTA: ' + req.url);
    res.render('kor_pocetna');
}

module.exports.kor_restorani = (req,res) => {
    console.log('RUTA: ' + req.url);
    
    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select id,naziv,grad,kategorija,zvjezdice,dodatno from restorani';
        client.query(clientQuery,[],function(err,result){
            done();
            if(err){console.log(err);}
            res.render('kor_restorani', {result: result.rows});
        });
    });
}

module.exports.kor_meni_restorana =async (req,res) => {
    console.log('RUTA: ' + req.url);
    const token = req.cookies.jwt;
    const id_res = req.params.id_res;
    var kor_id;
    var kor_email;
    var kor_ime;
    var kor_prezime;
    var kor_adresa;

    await jwt.verify(token, 'avdo secret', function(err,result){
        kor_id=result.id;
        kor_email=result.email;
    });

    // pool.connect(function(err,client,done){
    //     if(err){console.log(err);}
    //     var clientQuery = 'select ime,prezime,adresa from korisnik where id=$1';
    //     client.query(clientQuery,[kor_id],function(err,result){
    //         done();
    //         if(err){console.log(err);}
    //         kor_ime = result.rows[0].ime;
    //         kor_prezime = result.rows[0].prezime;
    //         kor_adresa = result.rows[0].adresa;
    //     });
    // });
    
    
    await pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select ime,prezime,adresa from korisnik where id=$1';
        client.query(clientQuery,[kor_id],async function(err,result){
            done();
            if(err){console.log(err);}
            kor_ime = result.rows[0].ime;
            kor_prezime = result.rows[0].prezime;
            kor_adresa=result.rows[0].adresa;
            await pool.connect(function(err,client,done){
                if(err){console.log(err);}
                var clientQuery = 'select id,naziv,predjelo,glavno_jelo,desert,cijena from meni where id_res=$1';
                client.query(clientQuery,[id_res],function(err,result){
                    done();
                    if(err){console.log(err);}
                    res.render('kor_meni_restorana', {result: result.rows, restoran: id_res, kor_email: kor_email, kor_ime: kor_ime, kor_prezime: kor_prezime, kor_adresa: kor_adresa});
                });
            });
        });
    });
}

module.exports.kor_meni_akcije =async (req,res) => {
    const token = req.cookies.jwt;
    const id_meni = req.params.id_meni;
    var kor_id;
    var kor_email;
    var kor_ime;
    var kor_prezime;
    var kor_adresa;

    await jwt.verify(token, 'avdo secret', function(err,result){
        kor_id=result.id;
        kor_email=result.email;
    });

    await pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select ime,prezime,adresa from korisnik where id=$1';
        client.query(clientQuery,[kor_id],async function(err,result){
            done();
            if(err){console.log(err);}
            kor_ime = result.rows[0].ime;
            kor_prezime = result.rows[0].prezime;
            kor_adresa = result.rows[0].adresa;
            await pool.connect(function(err,client,done){
                if(err){console.log(err);}
                var clientQuery = 'select id_akcija,id_res from meni where id=$1';
                client.query(clientQuery,[id_meni],async function(err,result){
                    done();
                    if(err){console.log(err);}
                    var id_akcija = result.rows[0].id_akcija;
                    var id_res = result.rows[0].id_res;
                    await pool.connect(function(err,client,done){
                        if(err){console.log(err);}
                        var clientQuery = 'select id,naziv_akcije,pocetak,kraj,akcijska_cijena from akcija where id=$1';
                        client.query(clientQuery,[id_akcija],function(err,result){
                            done();
                            if(err){console.log(err);}
                            res.render('kor_meni_akcije', {result: result.rows, restoran: id_res, kor_email: kor_email, kor_ime: kor_ime, kor_prezime: kor_prezime,kor_adresa: kor_adresa, id_meni: id_meni });
                        });
                    });
                    
                });
            });
        });
    });
    
}

module.exports.kor_naruci_meni1 = async (req,res) => {
    console.log('RUTA: ' + req.url);
    const {id_meni,naziv,id_res,kor_email,kor_ime,kor_prezime,kor_adresa,cijena} = req.params;
    var date_ob = new Date();
    var date = ("0" + date_ob.getDate()).slice(-2);
    var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    var year = date_ob.getFullYear();
    var hours = date_ob.getHours();
    var minutes = date_ob.getMinutes();
    var vrijeme = hours+':'+minutes;
    
    res.render('kor_naruci_meni1', {id_meni: id_meni,naziv: naziv,id_res: id_res,kor_email: kor_email ,kor_ime: kor_ime,kor_prezime: kor_prezime,kor_adresa: kor_adresa,cijena: cijena, vrijeme:vrijeme});
}

module.exports.kor_naruci_meni1_post =async (req,res) => {
    const {id_meni,naziv,id_res,kor_email,kor_ime,kor_prezime,kor_adresa,cijena} = req.params;
    const {vrijeme,kolicina} = req.body;
    //console.log(vrijeme,kolicina);
    var date_ob = new Date();
    var date = ("0" + date_ob.getDate()).slice(-2);
    var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    var year = date_ob.getFullYear();
    var hours = date_ob.getHours();
    var minutes = date_ob.getMinutes();
    var datum = date+'.'+month+'.'+year;
    var trenutno_vrijeme = hours+':'+minutes;
    var vrijeme_za_dostavu;
    if(vrijeme===''){
        vrijeme_za_dostavu=trenutno_vrijeme;
    }else{
        vrijeme_za_dostavu=vrijeme;
    }
    var ukupna_cijena = cijena * kolicina;

    await pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select id_ar,id_dos from restorani where id=$1';
        client.query(clientQuery,[id_res],async function(err,result){
            done();
            if(err){console.log(err);}
            var id_dos = result.rows[0].id_dos;
            var id_ar = result.rows[0].id_ar;
            await pool.connect(function(err,client,done){
                if(err){console.log(err);}
                var clientQuery = `insert into narudzbe_ar 
                (naziv_narudzbe,ime,prezime,korisnik,adresa,kolicina,cijena,datum_narudzbe,rok_isporuke,id_meni,id_akcije,id_dos,id_res,id_ar) values
                ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`;
                client.query(clientQuery,[naziv,kor_ime,kor_prezime,kor_email,kor_adresa,kolicina,ukupna_cijena,datum,vrijeme_za_dostavu,id_meni,0,id_dos,id_res,id_ar],async function(err,result){
                    done();
                    if(err){console.log(err);}
                    console.log('NARUCENO ' + naziv + ' ' + trenutno_vrijeme + ' ' + ukupna_cijena);
                    await pool.connect(function(err,client,done){
                        if(err){console.log(err);}
                        var clientQuery = `insert into narudzbe_kor
                        (naziv_narudzbe,ime,prezime,korisnik,adresa,kolicina,cijena,datum_narudzbe,rok_isporuke,id_meni,id_akcije,
                        id_dos,id_res,id_ar,status) values
                        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`;
                        client.query(clientQuery,[naziv,kor_ime,kor_prezime,kor_email,kor_adresa,kolicina,ukupna_cijena,datum,vrijeme_za_dostavu,id_meni,0,id_dos,id_res,id_ar,'NIJE ISPORUCENO'],function(err,result){
                            done();
                            if(err){console.log(err);}
                            res.redirect('/kor_meni_restorana/'+id_res);
                        });
                    });
                });
            });
        });
    });
}

module.exports.kor_naruci_akciju1 = async (req,res) => {
    console.log('RUTA: ' + req.url);
    const {id_meni,naziv_akcije,id_res,kor_email,kor_ime,kor_prezime,kor_adresa,akcijska_cijena,id_akcije} = req.params;
    var date_ob = new Date();
    var date = ("0" + date_ob.getDate()).slice(-2);
    var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    var year = date_ob.getFullYear();
    var hours = date_ob.getHours();
    var minutes = date_ob.getMinutes();
    var vrijeme = hours+':'+minutes;
    
    res.render('kor_naruci_akciju1', {id_meni: id_meni,naziv_akcije: naziv_akcije,id_res: id_res,kor_email: kor_email ,kor_ime: kor_ime,kor_prezime: kor_prezime,kor_adresa: kor_adresa,akcijska_cijena: akcijska_cijena, vrijeme:vrijeme, id_akcije: id_akcije});
}

module.exports.kor_naruci_akciju1_post =async (req,res) => {
    const {id_meni,naziv_akcije,id_res,kor_email,kor_ime,kor_prezime,kor_adresa,akcijska_cijena,id_akcije} = req.params;
    const {vrijeme,kolicina} = req.body;
    //console.log(vrijeme,kolicina);
    var date_ob = new Date();
    var date = ("0" + date_ob.getDate()).slice(-2);
    var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    var year = date_ob.getFullYear();
    var hours = date_ob.getHours();
    var minutes = date_ob.getMinutes();
    var datum = date+'.'+month+'.'+year;
    var trenutno_vrijeme = hours+':'+minutes;
    var vrijeme_za_dostavu;
    if(vrijeme===''){
        vrijeme_za_dostavu=trenutno_vrijeme;
    }else{
        vrijeme_za_dostavu=vrijeme;
    }
    var ukupna_cijena = akcijska_cijena * kolicina;

    await pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'select id_ar,id_dos from restorani where id=$1';
        client.query(clientQuery,[id_res],async function(err,result){
            done();
            if(err){console.log(err);}
            var id_dos = result.rows[0].id_dos;
            var id_ar = result.rows[0].id_ar;
            await pool.connect(function(err,client,done){
                if(err){console.log(err);}
                var clientQuery = `insert into narudzbe_ar 
                (naziv_narudzbe,ime,prezime,korisnik,adresa,kolicina,cijena,datum_narudzbe,rok_isporuke,id_meni,id_akcije,id_dos,id_res,id_ar) values
                ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`;
                client.query(clientQuery,[naziv_akcije,kor_ime,kor_prezime,kor_email,kor_adresa,kolicina,ukupna_cijena,datum,vrijeme_za_dostavu,id_meni,id_akcije,id_dos,id_res,id_ar],async function(err,result){
                    done();
                    if(err){console.log(err);}
                    console.log('NARUCENO ' + naziv_akcije + ' ' + trenutno_vrijeme + ' ' + ukupna_cijena);
                    await pool.connect(function(err,client,done){
                        if(err){console.log(err);}
                        var clientQuery = `insert into narudzbe_kor
                        (naziv_narudzbe,ime,prezime,korisnik,adresa,kolicina,cijena,datum_narudzbe,rok_isporuke,id_meni,id_akcije,
                        id_dos,id_res,id_ar,status) values
                        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`;
                        client.query(clientQuery,[naziv_akcije,kor_ime,kor_prezime,kor_email,kor_adresa,kolicina,ukupna_cijena,datum,vrijeme_za_dostavu,id_meni,id_akcije,id_dos,id_res,id_ar,'NIJE ISPORUCENO'],function(err,result){
                            done();
                            if(err){console.log(err);}
                            res.redirect('/kor_meni_restorana/'+id_res);
                        });
                });
            });
        });
    });
});
}

module.exports.kor_narudzbe = async (req,res) => {
    const token = req.cookies.jwt;
    var korisnik;
    await jwt.verify(token, 'avdo secret', function(err,result){
        if(err){console.log(err);}
        korisnik=result.email;
    });

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = `select * from narudzbe_kor where korisnik=$1`;
        client.query(clientQuery,[korisnik],function(err,result){
            done();
            if(err){console.log(err);}
            res.render('kor_narudzbe', {result: result.rows});
        });
    });
}

module.exports.kor_izbrisi_zavrsenu_narudzbu = async (req,res) => {
    const {id_narudzbe} = req.params;

    pool.connect(function(err,client,done){
        if(err){console.log(err);}
        var clientQuery = 'delete from narudzbe_kor where id=$1';
        client.query(clientQuery,[id_narudzbe],function(err,result){
            done();
            if(err){console.log(err);}
            res.sendStatus(200);
        });
    });
}