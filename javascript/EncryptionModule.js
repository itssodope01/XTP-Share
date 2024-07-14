const EncryptionModule = (function() {

  let encryptionKeys = new Map(); // Using Map for better key management

  // Function to generate a new encryption key
  async function generateEncryptionKey() {
    try {
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      const keyId = generateUUID();
      encryptionKeys.set(keyId, key); // Storing the generated key with ID
      return keyId;
    } catch (error) {
      console.error('Error generating encryption key:', error);
      throw error;
    }
  }

  // Function to generate a UUID
  function generateUUID() {
    return crypto.randomUUID();
  }

  // Function to retrieve an encryption key
  function getEncryptionKey(keyId) {
    return encryptionKeys.get(keyId);
  }
  
  // Function to delete an encryption key
  function deleteEncryptionKey(keyId) {
    encryptionKeys.delete(keyId);
  }

  // Function to read file as a stream
  function readFileAsStream(file) {
    return file.stream();
  }

  // Function to encrypt a file using a unique encryption key
  async function encryptFile(file) {
    try {
      const encryptionKey = await generateEncryptionKey(); // New key for each encryption
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const readableStream = readFileAsStream(file);
      const writableStream = new WritableStream({
        write: async (chunk) => {
          const encryptedChunk = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encryptionKeys.get(encryptionKey), chunk);
          return new Uint8Array(encryptedChunk);
        }
      });
      const encryptedStream = readableStream.pipeThrough(new TransformStream(new TextEncoder(), writableStream));
      const encryptedData = await new Response(encryptedStream).arrayBuffer();
      const encryptedFile = new File([iv, encryptedData], file.name); // Prepend IV to encrypted data
      return { encryptedFile, encryptionKey };
    } catch (error) {
      console.error('Error encrypting file:', error);
      throw error;
    }
  }

  // Function to decrypt a file using a specific encryption key
  async function decryptFile(encryptedFile, encryptionKey) {
    try {
      const iv = encryptedFile.slice(0, 12);
      const encryptedData = encryptedFile.slice(12);
      const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, encryptionKeys.get(encryptionKey), encryptedData);
      return new File([new Uint8Array(decryptedData)], encryptedFile.name);
    } catch (error) {
      console.error('Error decrypting file:', error);
      throw error;
    }
  }

// Function to encrypt all files simultaneously
async function encryptAllFiles(uploadedFiles) {

  encryptedFiles = [];
  
  try {
    await Promise.all(uploadedFiles.map(async file => {
      try {
        const encryptedFile = await encryptFile(file);
        encryptedFiles.push(encryptedFile); // Push encrypted file to array
      } catch (error) {
        console.error('Error encrypting file:', error);
        throw error;
      }
    }));
    
  } catch (error) {
    console.error('Error handling file upload:', error);
    throw error;
  }
}


  // Function to decrypt all files simultaneously
  async function decryptAllFiles(encryptedFiles) {
    try {
      const decryptedFiles = await Promise.all(encryptedFiles.map(async ({ encryptedFile, encryptionKey }) => {
        try {
          const decryptedFile = await decryptFile(encryptedFile, encryptionKey);
          return decryptedFile;
        } catch (error) {
          console.error('Error decrypting file:', error);
          throw error;
        }
      }));
      return decryptedFiles;
    } catch (error) {
      console.error('Error handling decryption:', error);
      throw error;
    }
  }

  return {
    encryptFile,
    encryptAllFiles
  };
})();