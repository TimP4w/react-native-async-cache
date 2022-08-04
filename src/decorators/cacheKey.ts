import {cacheKeyMetadataKey} from './metadata';

function cacheKey(
  target: object,
  propertyKey: string | symbol,
  parameterIndex: number,
) {
  const existingCacheKeyParameters: number[] =
    Reflect.getOwnMetadata(cacheKeyMetadataKey, target, propertyKey) || [];
  existingCacheKeyParameters.push(parameterIndex);
  Reflect.defineMetadata(
    cacheKeyMetadataKey,
    existingCacheKeyParameters,
    target,
    propertyKey,
  );
}

export default cacheKey;
