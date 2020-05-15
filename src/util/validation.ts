const validateComponentName = (value: string | undefined) => {
    if (!value) {
        return 'Component name must not be empty.';
    }
    if (/\s/.test(value)) {
        return 'Component name can not contain spaces.';
    }
    if (value[0] !== value[0].toUpperCase()) {
        return 'Component name must start from upper-case letter.';
    }
    return null;
};

module.exports = {
    validateComponentName
};
