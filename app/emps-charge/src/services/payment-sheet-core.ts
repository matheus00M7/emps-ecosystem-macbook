type ProviderError = { code?: string; message: string; localizedMessage?: string };
type SheetSdk = {
  initStripe: (options: { publishableKey: string; urlScheme: string }) => Promise<void>;
  initPaymentSheet: (options: { merchantDisplayName: string; paymentIntentClientSecret: string; returnURL: string }) => Promise<{ error?: ProviderError }>;
  presentPaymentSheet: () => Promise<{ error?: ProviderError }>;
};

export async function confirmStripePayment(
  clientSecret: string, publishableKey: string, links: { scheme: string; returnUrl: string }, sdk: SheetSdk,
) {
  if (!publishableKey.startsWith('pk_test_')) {
    throw new Error('A chave pública de teste do cartão não está disponível. Atualize os dados do carregador.');
  }
  await sdk.initStripe({ publishableKey, urlScheme: links.scheme });
  const initialized = await sdk.initPaymentSheet({
    merchantDisplayName: 'EMPS Charge', paymentIntentClientSecret: clientSecret, returnURL: links.returnUrl,
  });
  if (initialized.error) throw new Error(initialized.error.localizedMessage ?? initialized.error.message);
  const result = await sdk.presentPaymentSheet();
  if (result.error?.code === 'Canceled') return { canceled: true };
  if (result.error) throw new Error(result.error.localizedMessage ?? result.error.message);
  return { canceled: false };
}
