import { PROVIDERS } from '../shared/interfaces';

import { AsaasProvider } from './AsaasProvider';
import { MercadoPagoProvider } from './MercadoPagoProvider';

export const providers = {
    [PROVIDERS.ASAAS]: AsaasProvider,
    [PROVIDERS.MERCADO_PAGO]: MercadoPagoProvider
}

export {
    AsaasProvider,
    MercadoPagoProvider
}