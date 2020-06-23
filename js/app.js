let DB;

// Selectores de la interfaz

const form = document.querySelector('form'),
      nombreMascota = document.querySelector('#mascota'),
      nombreCLiente = document.querySelector('#cliente'),
      telefono =document.querySelector('#telefono'),
      fecha = document.querySelector('#fecha'),
      hora = document.querySelector('#hora'),
      sintomas = document.querySelector('#sintomas'),
      citas = document.querySelector('#citas'),
      headingAdministra = document.querySelector('#administra');

// Esperar por el DOM Ready

document.addEventListener('DOMContentLoaded', () => {
    // crear la base de datos 
    // open recibe 2 parametros: nombre de la base de datos y la version. (siempre en numeros enteros)
    let crearDB = window.indexedDB.open('citas', 1);

    //Si hay un error enviar a la consola
    crearDB.onerror = function() {
        console.log('error')
    }

    //Si todo esta bien mostrar en consola y asignar un abase de datos
    crearDB.onsuccess = function() {
       // console.log('todo listo');
        
        //Asignar a la base de datos
        DB = crearDB.result;
        //console.log(DB);

        mostrarCitas();
        
    }

    // Este metodo solo corre una vez y es ideal para crear el Schema de la base de datos
    crearDB.onupgradeneeded = function(e) {
       // el evento que corre es la misma base de datos
       let db = e.target.result;
      
       // definir el ebjectstore, toma 2 parametros el nombre de la base de datos y segundo las opciones de la base de /////datos y se pasa como un objeto.
       //keypath es el indice de la base de datos
       let objectStore = db.createObjectStore('citas', {keyPath: 'key', autoIncrement: true } );
    
       //crear los indices y los campos de la base de datos, createIndex : 3 parametros, Nombre, keypath(como se va a definir en la base de datos) y opciones.
       objectStore.createIndex('mascota', 'mascota', {unique : false } );
       objectStore.createIndex('cliente', 'cliente', {unique : false } );
       objectStore.createIndex('telefono', 'telefono', {unique : false } );
       objectStore.createIndex('fecha', 'fecha', {unique : false } );
       objectStore.createIndex('hora', 'hora', {unique : false } );
       objectStore.createIndex('sintomas', 'sintomas', {unique : false } );

       console.log('base de datos creada y lista');
       
    }

    // cuando el formulario se envia
    form.addEventListener('submit', agregarDatos);
    function agregarDatos(e) {
        e.preventDefault();
        
        const nuevaCita = {
            mascota : nombreMascota.value,
            cliente : nombreCLiente.value,
            telefono : telefono.value,
            fecha : fecha.value,
            hora : hora.value,
            sintomas : sintomas.value
        }

        //console.log(nuevaCita);

        // Insertar la informacion de nuevaCita en la base de datos
        //en IndexedDB se utilizan las transacciones
        let transaction = DB.transaction(['citas'], 'readwrite');
        let objectStore = transaction.objectStore('citas');
       // console.log(objectStore);
        let peticion = objectStore.add(nuevaCita);
        console.log(peticion);

        // metodos para verificar lo que sucede con la base de datos.
        peticion.onsuccess = () => {
            form.reset();
        }
        transaction.oncomplete = () => {
            console.log('cita agregada');
            mostrarCitas();
        }
        transaction.onerror = () => {
            console.log('Hubo un error');
            
        }

    }

    function mostrarCitas() {
        //limpiar las citas anteriores
       citas.textContent = '';

       //creamos ObjectStore
       let objectStore = DB.transaction('citas').objectStore('citas');

       //esto retorna una peticion que se abre con: openCursor
       //openCursor: abre el cursor para comezar a recorrer los registros
       objectStore.openCursor().onsuccess = function(e) {
           //Cursor se va a ubicar en el registro indicado para acceder a los datos 
            let cursor = e.target.result;
           // console.log(cursor);

           if(cursor) {
               let citaHTML = document.createElement('li');
               // le damos un Id personalizado de esos que comienzan con data. y este va a ser el key (que es el que se estara incrementando por cada registro linea 45)
               citaHTML.setAttribute('data-cita-id', cursor.value.key);
               citaHTML.classList.add('list-group-item');

               citaHTML.innerHTML = `
                <p class="font-weight-bold">Mascota: <span class="font-weight-normal">${cursor.value.mascota}</span></p>
                <p class="font-weight-bold">Cliente: <span class="font-weight-normal">${cursor.value.cliente}</span></p>
                <p class="font-weight-bold">Teléfono: <span class="font-weight-normal">${cursor.value.telefono}</span></p>
                <p class="font-weight-bold">Fecha: <span class="font-weight-normal">${cursor.value.fecha}</span></p>
                <p class="font-weight-bold">Hora: <span class="font-weight-normal">${cursor.value.hora}</span></p>
                <p class="font-weight-bold">Síntomas: <span class="font-weight-normal">${cursor.value.sintomas}</span></p>
                
               `;

               //Boton de borrar
               const botonBorrar = document.createElement('button');
               botonBorrar.classList.add('borrar', 'btn', 'btn-danger');
               botonBorrar.innerHTML = '<span aria-hidden="true">X</span> Borrar';
               botonBorrar.onclick = borrarCita;
               citaHTML.appendChild(botonBorrar);

               // append en el padre.
               citas.appendChild(citaHTML);

               //una vez que terminamos tenemos que decirle al cursor que continue en caso de que tengamos mas regitros los siga contando. 
               //Consultar los proximos registros
               cursor.continue();

           }else {
             if(!citas.firstChild){
                   //cuando no hay registros
               headingAdministra.textContent = 'Agrega citas para comenzar';
               let listado = document.createElement('p');
               listado.classList.add('text-center');
               listado.textContent = "No hay registros";
               citas.appendChild(listado);
             }else {
                 headingAdministra.textContent = 'Administra tus citas'
             }

           }

       }

    }

    function borrarCita(e) {
        let citaID = Number(e.target.parentElement.getAttribute('data-cita-id'));

        //Para eliminarlo del IndexedDB
        //en IndexedDB se utilizan las transacciones
        let transaction = DB.transaction(['citas'], 'readwrite');
        let objectStore = transaction.objectStore('citas');
  
        let peticion = objectStore.delete(citaID);

        //para eliminar del DOM
        transaction.oncomplete = () => {
            e.target.parentElement.parentElement.removeChild(e.target.parentElement);
            console.log(`Se elimino la cita con el Id: ${citaID} `);

            if(!citas.firstChild){
                //cuando no hay registros
            headingAdministra.textContent = 'Agrega citas para comenzar';
            let listado = document.createElement('p');
            listado.classList.add('text-center');
            listado.textContent = "No hay registros";
            citas.appendChild(listado);
          }else {
              headingAdministra.textContent = 'Administra tus citas'
          }

        }
        
    }

})