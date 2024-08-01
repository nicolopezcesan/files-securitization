
# Instalación

## 1 - Instalar dependecias

```bash
npm install
```
### 2 - Instalar y ejecutar Ganache-cli - testNet de ethereum
- Instala globalmente la testnet de ganache
```bash
npm install -g ganache-cli
``` 
-  Inicia en nueva terminal la blockchain de Ganache

```bash
ganache-cli --gasLimit 15000000
``` 

### 3 - Iniciar NODO IPFS

- Instalar la biblioteca 
```bash
npm install ipfs-http-client@56.0.2
```

- Ejecutar nodo
```bash
jsipfs daemon
```
### * Smart Contract Deployment
- Ingresar a Remix IDE https://remix.ethereum.org/.
- Crear un nuevo smart contract: (El mismo se encuentra en contracts/Contract.sol)
```bash
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Contract {
    string public storedData;

    function set(string memory _data) public {
        storedData = _data;
    }

    function get() public view returns (string memory) {
        return storedData;
    }
}
```
- Compila el contrato y haz el deployed seleccionando "External Http Provider" -> http://127.0.0.1:8545 (puerto de ganache).
- Copiar el ABI desde remix y la Dirección del contrato en las variables de entorno. (convertir el JSON a una sola linea https://jsonformatter.org/json-to-one-line).

# Iniciar el proyecto

```bash
npm run start
```
```bash
npm run start:dev
```



# Endpoints

## Datos JSON

### 1. Almacenar datos JSON en un bloque
**POST** http://localhost:5001/api/endpoint/send

- Body -> raw -> JSON

```bash
{
  "field1": "value1",
  "field2": "value2",
  "field3": 123,
  "field4": true
}
```
 - Respuesta
```bash
{
    "sha256Hash": "a8d6726e42c9d9e5d9b19c9f042555c3ad153cb7e26d8b6d79adf278eef73cb4",
    "transactionHash": "0x29fa1fba1ab3fada6992fb669571200525d340a741733c323c88d1052ae1d6fa"
}
```
- El **sha256Hash** nos permite comparar y verificar la inmutabilidad.
- El **transactionHash** lo utilizaremos para traer los datos de la blockchain. 

### 2. Consultar datos JSON almacenados en un bloque

**GET** http://localhost:5001/api/endpoint/data/[transactionHash]


### 3. Consultar Informacion de la transacción de un bloque
**GET** http://localhost:5001/api/endpoint/infostamp/[transactionHash]

---

## Firma e Inmutabilidad de Documentos

### 1. Firmar un documento y obtener sello de tiempo(.ots)
**POST** http://localhost:5001/api/timestamp/document

*Body -> form-data*

| Key | Type | Value |
| ------------ | ----------- | ----------- |
| file    | File   | Archivo de cualquier formato   |

Respuesta
  - **documentHash:** Hash del documento SHA256.
  - **ipfsHash:** CID del documento IPFS. 
  - **Path:** Almacenamiento archivos. Se guarda el archivo Original y el .ots en la carpeta 'documents'. Se guardaran con el nombre del hash.
  - **timestampProof:** Prueba de openTimestamp.


### 2. Obtener informacion del sello de tiempo .ots
**POST** http://localhost:5001/api/document/info 

*Body -> form-data*

| Key | Type | Value |
| ------------ | ----------- | ----------- |
| file    | File   | archivo **.ots**   |

Respuesta
  - **documentHash:** Hash del documento original firmado SHA256.
  - **info:** Info del sello de tiempo.

### 3. Comprobar inmutabilidad del archivo
**POST** http://localhost:5001/api/document/verify

*Body -> form-data*

  | Key | Type | Value |
| ------------ | ----------- | ----------- |
| file    | File   | archivo **.ots**   |
| file    | File   | Archivo Original   |

Respuesta
  - **otsHashValue:** Hash obtenido del sello de tiempo.
  - **newFileHashValue:** CID del documento IPFS.
  - **hashesMatch:** Compara ambos hash.


## Descargar documentos de IPFS

```bash
jsipfs get [CID IPFS]
```
- Se guardara el archivo con el nombre del CID. Hay que añadirle la extensión para visualizarlo correctamente.
