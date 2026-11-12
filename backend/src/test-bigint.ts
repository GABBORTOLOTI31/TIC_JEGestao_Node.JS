// Teste isolado da serialização BigInt
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const id = BigInt('9007199254740991');
const resultado = JSON.stringify({ id });
const esperado = '{"id":"9007199254740991"}';

if (resultado === esperado) {
  console.log('✅ BigInt serializado corretamente:', resultado);
} else {
  console.error('❌ Falha na serialização BigInt:', resultado);
}
