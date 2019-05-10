var options
var tbl_head_row = {
    header: true,
    content: 'Table content',
    colspan: 3
}
options = {
    items: [
        {
            name: 'Heading',
            level: 'h1',
            content: 'Extra-big heading'
        },
        {
            name: 'Heading',
            level: 'h2',
            content: 'Big heading'
        },
        {
            name: 'Heading',
            level: 'h3',
            content: 'Medium heading'
        },
        {
            name: 'Heading',
            level: 'h4',
            content: 'Small heading'
        },
        {
            name: 'Heading',
            level: 'h5',
            content: 'Extra-small heading'
        },
        {
            name: 'Heading',
            level: 'h6',
            content: 'Minimum heading'
        },
        {
            name: 'Paragraph',
            content: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a',
        },
        {
            name: 'Paragraph',
            imageAlign: 'left',
            images: [
                { src: 'https://placehold.jp/3d4070/ffffff/600x400.png?text=Dummy', 'caption': 'Dummy caption' }
            ],
            content: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a',
        },
        {
            name: 'List',
            type: 'unordered',
            rows: [
                { content: 'This is the text of the list' },
                { content: 'This is the text of the list' },
                { content: 'This is the text of the list' }
            ]
        },
        {
            name: 'List',
            type: 'ordered',
            rows: [
                { content: 'This is the text of the list' },
                { content: 'This is the text of the list' },
                { content: 'This is the text of the list' }
            ]
        },
        {
            name: 'Table',
            rows: [
                {
                    cells: [
                        tbl_head_row,
                        { dummy: true, ref: tbl_head_row },
                        { dummy: true, ref: tbl_head_row }
                    ]
                },
                {
                    cells: [
                        {
                            header: true,
                            content: 'header cell'
                        },
                        {
                            content: 'cell'
                        },
                        {
                            content: 'cell'
                        }
                    ]
                },
                {
                    cells: [
                        {
                            header: true,
                            content: 'header cell'
                        },
                        {
                            content: 'cell'
                        },
                        {
                            content: 'cell'
                        }
                    ]
                }
            ]
        },
        {
            name: 'Column',
            columns: [
                {
                    items: [
                        {
                            name: 'Heading',
                            level: 'h3',
                            content: 'Heading in a column'
                        },
                        {
                            name: 'Paragraph',
                            images: [
                                { src: 'https://placehold.jp/3d4070/ffffff/400x300.png?text=Dummy', caption: 'Image caption' }
                            ],
                            content: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo'
                        }
                    ]
                },
                {
                    items: [
                        {
                            name: 'List',
                            type: 'unoradered',
                            rows: [
                                { content: 'This is the text of the list in a column' },
                                { content: 'This is the text of the list in a column' },
                                { content: 'This is the text of the list in a column' }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            name: 'Html',
            content: '<div style="color:#f77; font-size:1.5rem;">Here is a raw html</div>'
        }
    ],
    loadItemsFromInputTag: false,
    allowStyledText: true,
    styledTextClasses: ['bold','link','red','green','blue'],
    onLoad: function (html) {
        updatePreview(html);
    },
    onUpdate: function (html) {
        updatePreview(html);
    }
};
new BlockEditor('#app1', options);

// Update preview
var previewBody;
function updatePreview(html) {
    if (previewBody) {
        previewBody.innerHTML = html;
    } else {
        launchPreview(html);
        previewBody = document.querySelector('#preview');
    }
}

// Preview window
function launchPreview(html) {
    var jsFrame = new JSFrame({
        horizontalAlign: 'left',
        verticalAlign: 'top',
    });
    var frame = jsFrame.create({
        title: 'Preview',
        left: 200, top: 200, width: 600, height: 400, minWidth: 300, minHeight: 200,
        appearanceName: 'material',
        appearanceParam: {
            border: {
                shadow: '0px 0px 6px -3px rgba(0,0,0,0.42)',
                width: 1,
                color: 'rgba(0,0,0,.15)',
                radius: 4,
            },
            titleBar: {
                background: 'rgba(97, 104, 111, 1.0)'
            }
        },
        style: {
            backgroundColor: 'rgba(255,255,255,0.88)',
            overflow: 'auto'
        },
        html: '<div id="preview" class="preview-body">' + html + '</div>'
    });
    frame.show();

    frame.setControl({
        maximizeButton: 'maximizeButton',
        demaximizeButton: 'restoreButton',
        minimizeButton: 'minimizeButton',
        deminimizeButton: 'deminimizeButton',
        animation: true,
        animationDuration: 200,
    });
}
