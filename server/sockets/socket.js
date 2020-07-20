const { io } = require('../server');

const { Usuarios } = require('../clases/usuarios');
const { crearMensaje } = require('../utils/util');

const usuarios = new Usuarios();

io.on('connection', (client) => {


    client.on('entrarChat', (data, callback) => {
        console.log(data);
        if (!data.nombre || !data.sala) {
            return callback({
                err: true,
                message: 'El nombre y la sala son necesarios'
            });
        }

        client.join(data.sala);

        usuarios.agregarPersona(client.id, data.nombre, data.sala)

        client.broadcast.to(data.sala).emit('listaPersona', usuarios.getPersonasPorSalas(data.sala));
        client.broadcast.to(data.sala).emit('crearMensaje', crearMensaje('Admin', `${data.nombre} está en linea`));

        callback(usuarios.getPersonasPorSalas(data.sala));

    });

    client.on('crearMensaje', (data, callback) => {

        let persona = usuarios.getPersona(client.id);

        let mensaje = crearMensaje(persona.nombre, data.mensaje);

        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);

        callback(mensaje);
    });

    client.on('disconnect', () => {

        let personaBorrada = usuarios.borrarPersona(client.id)

        console.log(personaBorrada);

        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Admin', `${personaBorrada.nombre} salió`));
        client.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonasPorSalas(personaBorrada.sala));
    });

    //mensaje privado
    client.on('mensajePrivado', data => {
        let persona = usuarios.getPersona(client.id);

        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));
    });

});