/*
   Copyright (c) 2017 Ahome' Innovation Technologies. All rights reserved.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

package com.ait.lienzo.client.core.image.filter;

import com.ait.lienzo.client.core.shape.json.IFactory;
import com.ait.lienzo.client.core.shape.json.validators.ValidationContext;
import com.ait.lienzo.client.core.shape.json.validators.ValidationException;
import com.ait.lienzo.client.core.types.ImageDataUtil;
import com.ait.lienzo.shared.core.types.ImageFilterType;
import elemental2.core.Uint8ClampedArray;
import elemental2.dom.ImageData;
import jsinterop.base.Js;

/**
 * A class that allows for easy creation of a Invert Color Image Filter.
 */
public class InvertColorImageDataFilter extends AbstractImageDataFilter<InvertColorImageDataFilter> {

    public InvertColorImageDataFilter() {
        super(ImageFilterType.InvertColorImageDataFilterType);
    }

    protected InvertColorImageDataFilter(Object node, ValidationContext ctx) throws ValidationException {
        super(ImageFilterType.InvertColorImageDataFilterType, node, ctx);
    }

    @Override
    public ImageData filter(ImageData source, boolean copy) {
        if (null == source) {
            return null;
        }
        if (copy) {
            source = ImageDataUtil.copy(source);
        }
        if (!isActive()) {
            return source;
        }
        final Uint8ClampedArray data = source.data;

        if (null == data) {
            return source;
        }
        filter_(data, FilterCommonOps.getLength(source));

        return source;
    }

    private final void filter_(Uint8ClampedArray dataArray, int length) {
        //int[] data = Uint8ClampedArray.ConstructorLengthUnionType.of(dataArray).asIntArray();
        int[] data = Js.uncheckedCast(dataArray);
        for (int i = 0; i < length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
    }

    @Override
    public IFactory<InvertColorImageDataFilter> getFactory() {
        return new InvertColorImageDataFilterFactory();
    }

    public static class InvertColorImageDataFilterFactory extends ImageDataFilterFactory<InvertColorImageDataFilter> {

        public InvertColorImageDataFilterFactory() {
            super(ImageFilterType.InvertColorImageDataFilterType);
        }
    }
}
