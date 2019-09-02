/**
 * ScandiPWA - Progressive Web App for Magento
 *
 * Copyright © Scandiweb, Inc. All rights reserved.
 * See LICENSE for license details.
 *
 * @license OSL-3.0 (Open Software License ("OSL") v. 3.0)
 * @package scandipwa/scandipwa-development-toolkit
 * @link https://github.com/scandipwa/scandipwa-development-toolkit
 */

const validateComponentName = (value) => {
    if (!value) return 'Component name must not be empty.'
    if (/\s/.test(value)) return 'Component name can not contain spaces.'
    if (value[0] !== value[0].toUpperCase()) return 'Component name must start from upper-case letter.'
    return null;
};

module.exports = {
    validateComponentName
};
