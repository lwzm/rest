const translations = {
    'BACK': '返回',
    'DELETE': '删除',
    'CREATE': '创建',
    'EDIT': '修改',
    'EXPORT': '导出',
    'ADD_FILTER': '添加搜索',
    'SEE_RELATED': '{{ entityName }}',
    'LIST': '',
    'SHOW': '显示',
    'SAVE': '保存',
    'N_SELECTED': '{{ length }} 已选',
    'ARE_YOU_SURE': '确认操作?',
    'YES': 'Yes',
    'NO': 'No',
    'FILTER_VALUES': 'Filter values',
    'CLOSE': '关闭',
    'CLEAR': '清理',
    'CURRENT': '当前的',
    'REMOVE': '移除',
    'ADD_NEW': '新增 {{ name }}',
    'BROWSE': '浏览',
    'N_COMPLETE': '{{ progress }}% Complete',
    'CREATE_NEW': '新建',
    'SUBMIT': '确认提交',
    'SAVE_CHANGES': '保存变更',
    'BATCH_DELETE_SUCCESS': '删除成功',
    'DELETE_SUCCESS': '删除成功',
    'ERROR_MESSAGE': 'Oops, an error occurred (code: {{ status }})',
    'INVALID_FORM': 'Invalid form',
    'CREATION_SUCCESS': '创建成功',
    'EDITION_SUCCESS': '修改成功',
    'ACTIONS': '操作',
    'PAGINATION': '<strong>{{ begin }}</strong> - <strong>{{ end }}</strong> of <strong>{{ total }}</strong>',
    'NO_PAGINATION': '无记录',
    'PREVIOUS': '« ',
    'NEXT': ' »',
    'DETAIL': '详情',
    'STATE_CHANGE_ERROR': 'State change error: {{ message }}',
    'STATE_FORBIDDEN_ERROR': 'A server 403 error occured: {{ message }}',
    'NOT_FOUND': 'Not Found',
    'NOT_FOUND_DETAILS': 'The page you are looking for cannot be found. Take a break before trying again.',
}

const columnFormatMap = {
    "integer": "number",
    "smallint": "number",
    "bigint": "number",

    "jsonb": "json",
    "json": "json",

    "text": "text",
    "character varying": "string",
    "character": "string",

    "boolean": "boolean",

    "timestamp without time zone": "datetime",
    "timestamp with time zone": "datetime",
    "date": "date",

    "double precision": "float",
    "real": "float",
    "numeric": "float",
}

!function () {
    const other = {
        'resume': '简历',
        "name": "名字",
        "mobile": "联系电话",
        "sex": "性别",
        "ethnic": "民族",
        "education": "学历",
        "job_years": "工作时间",
        "desc_edu_exp": "教育经历",
        "desc_job_exp": "工作经历",
        "source": "来源",
        "ctime": "创建时间",
    }

    const other2 = {
    }

    for (const key in other) {
        const value = other[key]
        other2[`${key} >`] = `${value} >`
        other2[`${key} <`] = `${value} <`
        other2[`${key} =`] = `${value} =`
        other2[`${key} ~`] = `${value} ~`
    }

    Object.assign(translations, other)
    Object.assign(translations, other2)
}()

export default {
    translations,
    columnFormatMap,
}
