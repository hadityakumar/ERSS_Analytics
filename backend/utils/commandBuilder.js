import { config } from '../config/config.js';

export class CommandBuilder {
  buildCommand(params) {
    const {
      startDate, endDate, mainTypes, subtypes,
      severities, partOfDay, cityLocation,
      isFiltered, combinedFiltering, useDateFilteredBase
    } = params;

    const args = [config.PYTHON_SCRIPT];

    // Date filtering
    if (startDate && endDate) {
      args.push('--start-date', startDate, '--end-date', endDate);
    }

    // Other filters (only if filtered request)
    if (isFiltered) {
      // Type filtering
      if (mainTypes && mainTypes.length > 0) {
        args.push('--main-types', mainTypes.join(','));
      }
      if (subtypes && subtypes.length > 0) {
        args.push('--subtypes', subtypes.join(','));
      }
      
      if (severities && severities.length > 0) {
        args.push('--severities', severities.join(','));
      }
      if (partOfDay && partOfDay.length > 0) {
        args.push('--part-of-day', partOfDay.join(','));
      }
      if (cityLocation && cityLocation !== 'all') {
        args.push('--city-location', cityLocation);
      }
    }

    // Combined filtering flag
    if (combinedFiltering) {
      args.push('--combined-filtering');
    }

    // Use date-filtered base flag
    if (useDateFilteredBase) {
      args.push('--use-date-filtered-base');
    }

    return args;
  }
}